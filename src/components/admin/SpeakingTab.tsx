"use client";

import { useState, useEffect } from "react";
import { Trash2, Pencil, Download, Upload as UploadIcon } from "lucide-react";

interface SpeakingItem {
  _id: string;
  bookNumber: number;
  testNumber: number;
  partNumber: number;
  partType: string;
  topic?: string;
  instructions?: string;
  questions?: { questionNumber: number; questionText: string }[];
  cueCardPrompts?: string[];
  cueCardFinalPrompt?: string;
  sampleAnswers?: { questionNumber?: number; answerText: string }[];
}

interface Props {
  onToast: (msg: string, type: "success" | "error") => void;
}

const inputCls =
  "w-full rounded-lg border-[0.5px] border-[#2A3150] bg-[#12172B] px-3 py-2 text-sm text-[#F8FAFC] outline-none focus:border-[#6366F1]";

export default function SpeakingTab({ onToast }: Props) {
  const [items, setItems] = useState<SpeakingItem[]>([]);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({
    bookNumber: "",
    testNumber: "",
    partNumber: "1",
    partType: "INTERVIEW",
    topic: "",
    instructions: "",
    questionsText: "",
    cueCardPrompts: "",
    cueCardFinalPrompt: "",
    sampleAnswersText: "",
  });

  const fetchItems = async () => {
    const r = await fetch("/api/admin/speaking");
    if (r.ok) setItems(await r.json());
  };
  useEffect(() => { fetchItems(); }, []);

  const resetForm = () => {
    setEditId(null);
    setForm({ bookNumber: "", testNumber: "", partNumber: "1", partType: "INTERVIEW", topic: "", instructions: "", questionsText: "", cueCardPrompts: "", cueCardFinalPrompt: "", sampleAnswersText: "" });
  };

  const loadForEdit = (item: SpeakingItem) => {
    setEditId(item._id);
    setForm({
      bookNumber: String(item.bookNumber),
      testNumber: String(item.testNumber),
      partNumber: String(item.partNumber),
      partType: item.partType,
      topic: item.topic || "",
      instructions: item.instructions || "",
      questionsText: (item.questions || []).map((q) => q.questionText).join("\n"),
      cueCardPrompts: (item.cueCardPrompts || []).join("\n"),
      cueCardFinalPrompt: item.cueCardFinalPrompt || "",
      sampleAnswersText: (item.sampleAnswers || []).map((s) => s.answerText).join("\n---\n"),
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const questions = form.questionsText.split("\n").map((s) => s.trim()).filter(Boolean).map((text, i) => ({ questionNumber: i + 1, questionText: text }));
    const cueCardPrompts = form.cueCardPrompts.split("\n").map((s) => s.trim()).filter(Boolean);
    const sampleAnswers = form.sampleAnswersText.split("\n---\n").map((s) => s.trim()).filter(Boolean).map((text, i) => ({ questionNumber: i + 1, answerText: text }));

    const payload = {
      bookNumber: Number(form.bookNumber),
      testNumber: Number(form.testNumber),
      partNumber: Number(form.partNumber),
      partType: form.partType,
      topic: form.topic || undefined,
      instructions: form.instructions || undefined,
      questions,
      cueCardPrompts: cueCardPrompts.length > 0 ? cueCardPrompts : undefined,
      cueCardFinalPrompt: form.cueCardFinalPrompt || undefined,
      sampleAnswers: sampleAnswers.length > 0 ? sampleAnswers : undefined,
    };

    const url = editId ? `/api/admin/speaking/${editId}` : "/api/admin/speaking";
    const method = editId ? "PUT" : "POST";

    const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    if (res.ok) {
      onToast(editId ? "Updated" : "Created", "success");
      resetForm();
      fetchItems();
    } else {
      const d = await res.json();
      onToast(d.error || "Failed", "error");
    }
  };

  const handleDelete = async (id: string) => {
    const r = await fetch(`/api/admin/speaking/${id}`, { method: "DELETE" });
    if (r.ok) { onToast("Deleted", "success"); if (editId === id) resetForm(); fetchItems(); }
    else onToast("Failed", "error");
  };

  const handleExport = () => {
    const blob = new Blob([JSON.stringify(items, null, 2)], { type: "application/json" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "speaking-parts.json"; a.click();
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const data = JSON.parse(await file.text());
      const arr = Array.isArray(data) ? data : [data];
      let created = 0;
      for (const item of arr) {
        const { _id, __v, createdAt, updatedAt, ...rest } = item;
        const res = await fetch("/api/admin/speaking", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(rest) });
        if (res.ok) created++;
      }
      onToast(`Imported ${created} items`, "success");
      fetchItems();
    } catch { onToast("Invalid JSON", "error"); }
    e.target.value = "";
  };

  const isCueCard = form.partType === "CUE_CARD";

  return (
    <div>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        {editId && (
          <div className="flex items-center justify-between rounded-lg bg-[rgba(99,102,241,0.1)] px-3 py-2">
            <span className="text-sm text-[#818CF8]">Editing entry</span>
            <button type="button" onClick={resetForm} className="text-xs text-[#94A3B8] hover:text-white">Cancel</button>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <input type="number" placeholder="Book #" required value={form.bookNumber} onChange={(e) => setForm({ ...form, bookNumber: e.target.value })} className={inputCls} />
          <input type="number" placeholder="Test #" required value={form.testNumber} onChange={(e) => setForm({ ...form, testNumber: e.target.value })} className={inputCls} />
          <select value={form.partNumber} onChange={(e) => setForm({ ...form, partNumber: e.target.value })} className={inputCls}>
            <option value="1">Part 1</option><option value="2">Part 2</option><option value="3">Part 3</option>
          </select>
          <select value={form.partType} onChange={(e) => setForm({ ...form, partType: e.target.value })} className={inputCls}>
            <option value="INTERVIEW">Interview</option><option value="CUE_CARD">Cue Card</option><option value="DISCUSSION">Discussion</option>
          </select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <input placeholder="Topic" value={form.topic} onChange={(e) => setForm({ ...form, topic: e.target.value })} className={inputCls} />
          <input placeholder="Instructions" value={form.instructions} onChange={(e) => setForm({ ...form, instructions: e.target.value })} className={inputCls} />
        </div>

        <textarea placeholder="Questions (one per line)" required rows={4} value={form.questionsText} onChange={(e) => setForm({ ...form, questionsText: e.target.value })} className={inputCls} />

        {isCueCard && (
          <>
            <textarea placeholder="Cue card prompts (one per line, e.g. 'where it is')" rows={3} value={form.cueCardPrompts} onChange={(e) => setForm({ ...form, cueCardPrompts: e.target.value })} className={inputCls} />
            <input placeholder="Final prompt (e.g. 'and explain why you found it beautiful')" value={form.cueCardFinalPrompt} onChange={(e) => setForm({ ...form, cueCardFinalPrompt: e.target.value })} className={inputCls} />
          </>
        )}

        <textarea placeholder="Sample answers (separate multiple with ---)" rows={3} value={form.sampleAnswersText} onChange={(e) => setForm({ ...form, sampleAnswersText: e.target.value })} className={inputCls} />

        <button type="submit" className="mt-2 cursor-pointer rounded-lg bg-[#6366F1] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#818CF8]">
          {editId ? "Update Speaking Part" : "Save Speaking Part"}
        </button>
      </form>

      <div className="mt-6 flex items-center justify-between">
        <span className="text-sm font-medium text-[#F8FAFC]">Saved ({items.length})</span>
        <div className="flex gap-2">
          <button onClick={handleExport} className="inline-flex items-center gap-1 text-xs text-[#94A3B8] hover:text-white"><Download size={12} /> Export</button>
          <label className="inline-flex cursor-pointer items-center gap-1 text-xs text-[#94A3B8] hover:text-white"><UploadIcon size={12} /> Import<input type="file" accept=".json" onChange={handleImport} className="hidden" /></label>
        </div>
      </div>

      <div className="mt-3 flex flex-col gap-2">
        {items.map((item) => (
          <div key={item._id} className="flex items-center justify-between rounded-lg border-[0.5px] border-[#2A3150] bg-[#1E2540] px-4 py-3">
            <div className="min-w-0">
              <p className="text-sm font-medium text-[#F8FAFC]">
                Book {item.bookNumber} Test {item.testNumber} Part {item.partNumber}
              </p>
              <p className="text-xs text-[#64748B]">{item.partType} - {item.questions?.length || 0} questions</p>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => loadForEdit(item)} className="cursor-pointer text-[#64748B] hover:text-[#6366F1]"><Pencil size={14} strokeWidth={1.75} /></button>
              <button onClick={() => handleDelete(item._id)} className="cursor-pointer text-[#64748B] hover:text-[#EF4444]"><Trash2 size={14} strokeWidth={1.75} /></button>
            </div>
          </div>
        ))}
        {items.length === 0 && <p className="py-4 text-center text-sm text-[#64748B]">No speaking parts yet</p>}
      </div>
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import { Trash2, Pencil, Download, Upload as UploadIcon } from "lucide-react";
import QuestionGroupBuilder, {
  type QuestionGroupForm,
  makeEmptyGroup,
  serializeGroups,
  deserializeGroups,
} from "./QuestionGroupBuilder";
import FileUpload from "./FileUpload";

interface ListeningItem {
  _id: string;
  bookNumber: number;
  testNumber: number;
  partNumber: number;
  title?: string;
  audioUrl?: string;
  totalQuestions: number;
  questionGroups?: any[];
  transcript?: string;
  context?: string;
}

interface Props {
  onToast: (msg: string, type: "success" | "error") => void;
}

const inputCls =
  "w-full rounded-lg border-[0.5px] border-[#2A3150] bg-[#12172B] px-3 py-2 text-sm text-[#F8FAFC] outline-none focus:border-[#6366F1]";

export default function ListeningTab({ onToast }: Props) {
  const [items, setItems] = useState<ListeningItem[]>([]);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({
    bookNumber: "",
    testNumber: "",
    partNumber: "1",
    title: "",
    audioUrl: "",
    transcript: "",
    context: "",
  });
  const [groups, setGroups] = useState<QuestionGroupForm[]>([]);

  const fetchItems = async () => {
    const r = await fetch("/api/admin/listening");
    if (r.ok) setItems(await r.json());
  };
  useEffect(() => { fetchItems(); }, []);

  const resetForm = () => {
    setEditId(null);
    setForm({ bookNumber: "", testNumber: "", partNumber: "1", title: "", audioUrl: "", transcript: "", context: "" });
    setGroups([]);
  };

  const loadForEdit = (item: ListeningItem) => {
    setEditId(item._id);
    setForm({
      bookNumber: String(item.bookNumber),
      testNumber: String(item.testNumber),
      partNumber: String(item.partNumber),
      title: item.title || "",
      audioUrl: item.audioUrl || "",
      transcript: item.transcript || "",
      context: item.context || "",
    });
    setGroups(deserializeGroups(item.questionGroups || []));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      bookNumber: Number(form.bookNumber),
      testNumber: Number(form.testNumber),
      partNumber: Number(form.partNumber),
      title: form.title,
      audioUrl: form.audioUrl || undefined,
      transcript: form.transcript || undefined,
      context: form.context || undefined,
      questionGroups: serializeGroups(groups),
    };

    const url = editId ? `/api/admin/listening/${editId}` : "/api/admin/listening";
    const method = editId ? "PUT" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

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
    const r = await fetch(`/api/admin/listening/${id}`, { method: "DELETE" });
    if (r.ok) { onToast("Deleted", "success"); if (editId === id) resetForm(); fetchItems(); }
    else onToast("Failed", "error");
  };

  const handleExport = () => {
    const blob = new Blob([JSON.stringify(items, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "listening-sections.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      const arr = Array.isArray(data) ? data : [data];
      let created = 0;
      for (const item of arr) {
        const { _id, __v, createdAt, updatedAt, ...rest } = item;
        const res = await fetch("/api/admin/listening", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(rest),
        });
        if (res.ok) created++;
      }
      onToast(`Imported ${created} items`, "success");
      fetchItems();
    } catch {
      onToast("Invalid JSON file", "error");
    }
    e.target.value = "";
  };

  return (
    <div>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        {editId && (
          <div className="flex items-center justify-between rounded-lg bg-[rgba(99,102,241,0.1)] px-3 py-2">
            <span className="text-sm text-[#818CF8]">Editing entry</span>
            <button type="button" onClick={resetForm} className="text-xs text-[#94A3B8] hover:text-white">Cancel</button>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <input type="number" placeholder="Book #" required value={form.bookNumber} onChange={(e) => setForm({ ...form, bookNumber: e.target.value })} className={inputCls} />
          <input type="number" placeholder="Test #" required value={form.testNumber} onChange={(e) => setForm({ ...form, testNumber: e.target.value })} className={inputCls} />
          <select value={form.partNumber} onChange={(e) => setForm({ ...form, partNumber: e.target.value })} className={inputCls}>
            <option value="1">Part 1</option><option value="2">Part 2</option><option value="3">Part 3</option><option value="4">Part 4</option>
          </select>
        </div>

        <input placeholder="Title (optional)" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className={inputCls} />

        <FileUpload
          value={form.audioUrl}
          onChange={(url) => setForm({ ...form, audioUrl: url })}
          accept="audio/*"
          endpoint="/api/admin/upload-audio"
          folder="ieltsbuddy/audio"
          label="Audio file"
        />

        <textarea placeholder="Context / scene description (optional)" rows={2} value={form.context} onChange={(e) => setForm({ ...form, context: e.target.value })} className={inputCls} />
        <textarea placeholder="Transcript (optional)" rows={3} value={form.transcript} onChange={(e) => setForm({ ...form, transcript: e.target.value })} className={inputCls} />

        <div className="mt-2">
          <QuestionGroupBuilder groups={groups} setGroups={setGroups} />
        </div>

        <button type="submit" className="mt-2 cursor-pointer rounded-lg bg-[#6366F1] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#818CF8]">
          {editId ? "Update Listening Section" : "Save Listening Section"}
        </button>
      </form>

      <div className="mt-6 flex items-center justify-between">
        <span className="text-sm font-medium text-[#F8FAFC]">Saved ({items.length})</span>
        <div className="flex gap-2">
          <button onClick={handleExport} className="inline-flex items-center gap-1 text-xs text-[#94A3B8] hover:text-white">
            <Download size={12} /> Export
          </button>
          <label className="inline-flex cursor-pointer items-center gap-1 text-xs text-[#94A3B8] hover:text-white">
            <UploadIcon size={12} /> Import
            <input type="file" accept=".json" onChange={handleImport} className="hidden" />
          </label>
        </div>
      </div>

      <div className="mt-3 flex flex-col gap-2">
        {items.map((item) => (
          <div key={item._id} className="flex items-center justify-between rounded-lg border-[0.5px] border-[#2A3150] bg-[#1E2540] px-4 py-3">
            <div className="min-w-0">
              <p className="text-sm font-medium text-[#F8FAFC]">
                Book {item.bookNumber} Test {item.testNumber} Part {item.partNumber}
                {item.title ? ` - ${item.title}` : ""}
              </p>
              <p className="text-xs text-[#64748B]">
                {item.totalQuestions} Qs {item.audioUrl ? " | Has audio" : ""}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => loadForEdit(item)} className="cursor-pointer text-[#64748B] transition-colors hover:text-[#6366F1]">
                <Pencil size={14} strokeWidth={1.75} />
              </button>
              <button onClick={() => handleDelete(item._id)} className="cursor-pointer text-[#64748B] transition-colors hover:text-[#EF4444]">
                <Trash2 size={14} strokeWidth={1.75} />
              </button>
            </div>
          </div>
        ))}
        {items.length === 0 && <p className="py-4 text-center text-sm text-[#64748B]">No listening sections yet</p>}
      </div>
    </div>
  );
}

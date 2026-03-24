"use client";

import { useState, useEffect } from "react";
import { Trash2, Pencil, Download, Upload as UploadIcon } from "lucide-react";
import FileUpload from "./FileUpload";

interface WritingItem {
  _id: string;
  bookNumber: number;
  testNumber: number;
  taskNumber: number;
  taskType: string;
  prompt: string;
  instructions: string;
  minWords: number;
  timeRecommended: number;
  imageUrl?: string;
}

interface Props {
  onToast: (msg: string, type: "success" | "error") => void;
}

const inputCls =
  "w-full rounded-lg border-[0.5px] border-[#2A3150] bg-[#12172B] px-3 py-2 text-sm text-[#F8FAFC] outline-none focus:border-[#6366F1]";

export default function WritingTab({ onToast }: Props) {
  const [items, setItems] = useState<WritingItem[]>([]);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({
    bookNumber: "",
    testNumber: "",
    taskNumber: "1",
    taskType: "DESCRIBE_VISUAL",
    prompt: "",
    instructions: "",
    minWords: "150",
    timeRecommended: "20",
    imageUrl: "",
  });

  const fetchItems = async () => {
    const r = await fetch("/api/admin/writing");
    if (r.ok) setItems(await r.json());
  };
  useEffect(() => { fetchItems(); }, []);

  const resetForm = () => {
    setEditId(null);
    setForm({ bookNumber: "", testNumber: "", taskNumber: "1", taskType: "DESCRIBE_VISUAL", prompt: "", instructions: "", minWords: "150", timeRecommended: "20", imageUrl: "" });
  };

  const loadForEdit = (item: WritingItem) => {
    setEditId(item._id);
    setForm({
      bookNumber: String(item.bookNumber),
      testNumber: String(item.testNumber),
      taskNumber: String(item.taskNumber),
      taskType: item.taskType,
      prompt: item.prompt || "",
      instructions: item.instructions || "",
      minWords: String(item.minWords),
      timeRecommended: String(item.timeRecommended),
      imageUrl: item.imageUrl || "",
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      bookNumber: Number(form.bookNumber),
      testNumber: Number(form.testNumber),
      taskNumber: Number(form.taskNumber),
      taskType: form.taskType,
      prompt: form.prompt,
      instructions: form.instructions,
      minWords: Number(form.minWords),
      timeRecommended: Number(form.timeRecommended),
      imageUrl: form.imageUrl || undefined,
    };

    const url = editId ? `/api/admin/writing/${editId}` : "/api/admin/writing";
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
    const r = await fetch(`/api/admin/writing/${id}`, { method: "DELETE" });
    if (r.ok) { onToast("Deleted", "success"); if (editId === id) resetForm(); fetchItems(); }
    else onToast("Failed", "error");
  };

  const handleExport = () => {
    const blob = new Blob([JSON.stringify(items, null, 2)], { type: "application/json" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "writing-tasks.json"; a.click();
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
        const res = await fetch("/api/admin/writing", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(rest) });
        if (res.ok) created++;
      }
      onToast(`Imported ${created} items`, "success");
      fetchItems();
    } catch { onToast("Invalid JSON", "error"); }
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

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <input type="number" placeholder="Book #" required value={form.bookNumber} onChange={(e) => setForm({ ...form, bookNumber: e.target.value })} className={inputCls} />
          <input type="number" placeholder="Test #" required value={form.testNumber} onChange={(e) => setForm({ ...form, testNumber: e.target.value })} className={inputCls} />
          <select value={form.taskNumber} onChange={(e) => setForm({ ...form, taskNumber: e.target.value })} className={inputCls}>
            <option value="1">Task 1</option><option value="2">Task 2</option>
          </select>
          <select value={form.taskType} onChange={(e) => setForm({ ...form, taskType: e.target.value })} className={inputCls}>
            <option value="DESCRIBE_VISUAL">Describe Visual</option><option value="ESSAY">Essay</option>
          </select>
        </div>

        <input placeholder="Prompt (title)" required value={form.prompt} onChange={(e) => setForm({ ...form, prompt: e.target.value })} className={inputCls} />
        <textarea placeholder="Full instructions" required rows={3} value={form.instructions} onChange={(e) => setForm({ ...form, instructions: e.target.value })} className={inputCls} />

        <div className="grid grid-cols-2 gap-3">
          <input type="number" placeholder="Min words" required value={form.minWords} onChange={(e) => setForm({ ...form, minWords: e.target.value })} className={inputCls} />
          <input type="number" placeholder="Time (min)" required value={form.timeRecommended} onChange={(e) => setForm({ ...form, timeRecommended: e.target.value })} className={inputCls} />
        </div>

        <FileUpload
          value={form.imageUrl}
          onChange={(url) => setForm({ ...form, imageUrl: url })}
          accept="image/*"
          endpoint="/api/admin/upload-image"
          folder="ieltsbuddy/writing"
          label="Chart/Graph image"
        />

        <button type="submit" className="mt-2 cursor-pointer rounded-lg bg-[#6366F1] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#818CF8]">
          {editId ? "Update Writing Task" : "Save Writing Task"}
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
              <p className="text-sm font-medium text-[#F8FAFC]">{item.prompt || "Untitled"}</p>
              <p className="text-xs text-[#64748B]">Book {item.bookNumber} Test {item.testNumber} Task {item.taskNumber} - {item.taskType}</p>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => loadForEdit(item)} className="cursor-pointer text-[#64748B] hover:text-[#6366F1]"><Pencil size={14} strokeWidth={1.75} /></button>
              <button onClick={() => handleDelete(item._id)} className="cursor-pointer text-[#64748B] hover:text-[#EF4444]"><Trash2 size={14} strokeWidth={1.75} /></button>
            </div>
          </div>
        ))}
        {items.length === 0 && <p className="py-4 text-center text-sm text-[#64748B]">No writing tasks yet</p>}
      </div>
    </div>
  );
}

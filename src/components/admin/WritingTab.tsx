"use client";

import { useState, useEffect } from "react";
import { Trash2 } from "lucide-react";

interface WritingTaskItem {
  _id: string;
  bookNumber: number;
  testNumber: number;
  taskType: string;
  title: string;
}

interface WritingTabProps {
  onToast: (msg: string, type: "success" | "error") => void;
}

export default function WritingTab({ onToast }: WritingTabProps) {
  const [items, setItems] = useState<WritingTaskItem[]>([]);
  const [form, setForm] = useState({
    bookNumber: "",
    testNumber: "",
    taskType: "task1",
    title: "",
    instructions: "",
    imageUrl: "",
    sampleAnswer: "",
  });

  const fetchItems = async () => {
    const res = await fetch("/api/admin/writing");
    if (res.ok) setItems(await res.json());
  };

  useEffect(() => { fetchItems(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch("/api/admin/writing", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        bookNumber: Number(form.bookNumber),
        testNumber: Number(form.testNumber),
      }),
    });
    if (res.ok) {
      onToast("Writing task added", "success");
      setForm({ bookNumber: "", testNumber: "", taskType: "task1", title: "", instructions: "", imageUrl: "", sampleAnswer: "" });
      fetchItems();
    } else {
      const data = await res.json();
      onToast(data.error || "Failed to add", "error");
    }
  };

  const handleDelete = async (id: string) => {
    const res = await fetch(`/api/admin/writing/${id}`, { method: "DELETE" });
    if (res.ok) { onToast("Deleted", "success"); fetchItems(); }
    else onToast("Failed to delete", "error");
  };

  const inputCls = "w-full rounded-lg border-[0.5px] border-[#2A3150] bg-[#12172B] px-3 py-2 text-sm text-[#F8FAFC] outline-none focus:border-[#6366F1]";

  return (
    <div>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <input type="number" placeholder="Book #" required value={form.bookNumber} onChange={(e) => setForm({ ...form, bookNumber: e.target.value })} className={inputCls} />
          <input type="number" placeholder="Test #" required value={form.testNumber} onChange={(e) => setForm({ ...form, testNumber: e.target.value })} className={inputCls} />
          <select value={form.taskType} onChange={(e) => setForm({ ...form, taskType: e.target.value })} className={inputCls}>
            <option value="task1">Task 1</option>
            <option value="task2">Task 2</option>
          </select>
          <input placeholder="Title" required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className={inputCls} />
        </div>
        <textarea placeholder="Instructions" required rows={3} value={form.instructions} onChange={(e) => setForm({ ...form, instructions: e.target.value })} className={inputCls} />
        <input placeholder="Image URL (optional)" value={form.imageUrl} onChange={(e) => setForm({ ...form, imageUrl: e.target.value })} className={inputCls} />
        <textarea placeholder="Sample Answer (optional)" rows={3} value={form.sampleAnswer} onChange={(e) => setForm({ ...form, sampleAnswer: e.target.value })} className={inputCls} />
        <button type="submit" className="cursor-pointer rounded-lg bg-[#6366F1] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#818CF8]">Add Writing Task</button>
      </form>

      <div className="mt-6 flex flex-col gap-2">
        {items.map((item) => (
          <div key={item._id} className="flex items-center justify-between rounded-lg border-[0.5px] border-[#2A3150] bg-[#1E2540] px-4 py-3">
            <div className="min-w-0">
              <p className="text-sm font-medium text-[#F8FAFC]">{item.title}</p>
              <p className="text-xs text-[#64748B]">Book {item.bookNumber} - Test {item.testNumber} - {item.taskType}</p>
            </div>
            <button onClick={() => handleDelete(item._id)} className="cursor-pointer text-[#64748B] transition-colors hover:text-[#EF4444]">
              <Trash2 size={16} strokeWidth={1.75} />
            </button>
          </div>
        ))}
        {items.length === 0 && <p className="py-4 text-center text-sm text-[#64748B]">No writing tasks yet</p>}
      </div>
    </div>
  );
}

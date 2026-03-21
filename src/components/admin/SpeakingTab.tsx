"use client";

import { useState, useEffect } from "react";
import { Trash2 } from "lucide-react";

interface SpeakingItem {
  _id: string;
  bookNumber: number;
  testNumber: number;
  partNumber: number;
  questions: string[];
}

interface SpeakingTabProps {
  onToast: (msg: string, type: "success" | "error") => void;
}

export default function SpeakingTab({ onToast }: SpeakingTabProps) {
  const [items, setItems] = useState<SpeakingItem[]>([]);
  const [form, setForm] = useState({ bookNumber: "", testNumber: "", partNumber: "1", questionsText: "", topicCard: "" });

  const fetchItems = async () => { const r = await fetch("/api/admin/speaking"); if (r.ok) setItems(await r.json()); };
  useEffect(() => { fetchItems(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const questions = form.questionsText.split("\n").map((s) => s.trim()).filter(Boolean);
    const res = await fetch("/api/admin/speaking", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        bookNumber: Number(form.bookNumber),
        testNumber: Number(form.testNumber),
        partNumber: Number(form.partNumber),
        questions,
        topicCard: form.topicCard || undefined,
      }),
    });
    if (res.ok) {
      onToast("Speaking questions added", "success");
      setForm({ bookNumber: "", testNumber: "", partNumber: "1", questionsText: "", topicCard: "" });
      fetchItems();
    } else { const d = await res.json(); onToast(d.error || "Failed", "error"); }
  };

  const handleDelete = async (id: string) => {
    const r = await fetch(`/api/admin/speaking/${id}`, { method: "DELETE" });
    if (r.ok) { onToast("Deleted", "success"); fetchItems(); } else onToast("Failed", "error");
  };

  const inputCls = "w-full rounded-lg border-[0.5px] border-[#2A3150] bg-[#12172B] px-3 py-2 text-sm text-[#F8FAFC] outline-none focus:border-[#6366F1]";

  return (
    <div>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <div className="grid grid-cols-3 gap-3">
          <input type="number" placeholder="Book #" required value={form.bookNumber} onChange={(e) => setForm({ ...form, bookNumber: e.target.value })} className={inputCls} />
          <input type="number" placeholder="Test #" required value={form.testNumber} onChange={(e) => setForm({ ...form, testNumber: e.target.value })} className={inputCls} />
          <select value={form.partNumber} onChange={(e) => setForm({ ...form, partNumber: e.target.value })} className={inputCls}>
            <option value="1">Part 1</option><option value="2">Part 2</option><option value="3">Part 3</option>
          </select>
        </div>
        <textarea placeholder="Questions (one per line)" required rows={5} value={form.questionsText} onChange={(e) => setForm({ ...form, questionsText: e.target.value })} className={inputCls} />
        <textarea placeholder="Topic card (optional, for Part 2)" rows={3} value={form.topicCard} onChange={(e) => setForm({ ...form, topicCard: e.target.value })} className={inputCls} />
        <button type="submit" className="cursor-pointer rounded-lg bg-[#6366F1] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#818CF8]">Add Speaking Questions</button>
      </form>

      <div className="mt-6 flex flex-col gap-2">
        {items.map((item) => (
          <div key={item._id} className="flex items-center justify-between rounded-lg border-[0.5px] border-[#2A3150] bg-[#1E2540] px-4 py-3">
            <div className="min-w-0">
              <p className="text-sm font-medium text-[#F8FAFC]">Book {item.bookNumber} Test {item.testNumber} Part {item.partNumber}</p>
              <p className="text-xs text-[#64748B]">{item.questions.length} questions</p>
            </div>
            <button onClick={() => handleDelete(item._id)} className="cursor-pointer text-[#64748B] transition-colors hover:text-[#EF4444]"><Trash2 size={16} strokeWidth={1.75} /></button>
          </div>
        ))}
        {items.length === 0 && <p className="py-4 text-center text-sm text-[#64748B]">No speaking questions yet</p>}
      </div>
    </div>
  );
}

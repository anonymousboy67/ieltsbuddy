"use client";

import { useState, useEffect } from "react";
import { Trash2, Plus } from "lucide-react";

interface QuestionForm {
  questionNumber: string;
  questionType: string;
  questionText: string;
  options: string;
  correctAnswer: string;
}

interface ReadingItem {
  _id: string;
  bookNumber: number;
  testNumber: number;
  partNumber: number;
  title: string;
  questions: { questionNumber: number }[];
}

interface ReadingTabProps {
  onToast: (msg: string, type: "success" | "error") => void;
}

const questionTypes = [
  "multiple-choice", "true-false-not-given", "yes-no-not-given",
  "matching-headings", "sentence-completion", "short-answer",
  "summary-completion", "matching-information",
];

const emptyQ: QuestionForm = { questionNumber: "", questionType: "multiple-choice", questionText: "", options: "", correctAnswer: "" };

export default function ReadingTab({ onToast }: ReadingTabProps) {
  const [items, setItems] = useState<ReadingItem[]>([]);
  const [form, setForm] = useState({ bookNumber: "", testNumber: "", partNumber: "1", title: "", topic: "", difficulty: "beginner", passage: "" });
  const [questions, setQuestions] = useState<QuestionForm[]>([]);

  const fetchItems = async () => { const r = await fetch("/api/admin/reading"); if (r.ok) setItems(await r.json()); };
  useEffect(() => { fetchItems(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch("/api/admin/reading", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        bookNumber: Number(form.bookNumber),
        testNumber: Number(form.testNumber),
        partNumber: Number(form.partNumber),
        questions: questions.map((q) => ({
          questionNumber: Number(q.questionNumber),
          questionType: q.questionType,
          questionText: q.questionText,
          options: q.options ? q.options.split(",").map((s) => s.trim()) : [],
          correctAnswer: q.correctAnswer,
        })),
      }),
    });
    if (res.ok) {
      onToast("Reading passage added", "success");
      setForm({ bookNumber: "", testNumber: "", partNumber: "1", title: "", topic: "", difficulty: "beginner", passage: "" });
      setQuestions([]);
      fetchItems();
    } else { const d = await res.json(); onToast(d.error || "Failed", "error"); }
  };

  const handleDelete = async (id: string) => {
    const r = await fetch(`/api/admin/reading/${id}`, { method: "DELETE" });
    if (r.ok) { onToast("Deleted", "success"); fetchItems(); } else onToast("Failed", "error");
  };

  const updateQ = (i: number, field: keyof QuestionForm, val: string) => {
    const copy = [...questions]; copy[i] = { ...copy[i], [field]: val }; setQuestions(copy);
  };

  const inputCls = "w-full rounded-lg border-[0.5px] border-[#2A3150] bg-[#12172B] px-3 py-2 text-sm text-[#F8FAFC] outline-none focus:border-[#6366F1]";

  return (
    <div>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <input type="number" placeholder="Book #" required value={form.bookNumber} onChange={(e) => setForm({ ...form, bookNumber: e.target.value })} className={inputCls} />
          <input type="number" placeholder="Test #" required value={form.testNumber} onChange={(e) => setForm({ ...form, testNumber: e.target.value })} className={inputCls} />
          <select value={form.partNumber} onChange={(e) => setForm({ ...form, partNumber: e.target.value })} className={inputCls}>
            <option value="1">Part 1</option><option value="2">Part 2</option><option value="3">Part 3</option>
          </select>
          <select value={form.difficulty} onChange={(e) => setForm({ ...form, difficulty: e.target.value })} className={inputCls}>
            <option value="beginner">Beginner</option><option value="intermediate">Intermediate</option><option value="advanced">Advanced</option>
          </select>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <input placeholder="Title" required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className={inputCls} />
          <input placeholder="Topic" required value={form.topic} onChange={(e) => setForm({ ...form, topic: e.target.value })} className={inputCls} />
        </div>
        <textarea placeholder="Full passage text" required rows={6} value={form.passage} onChange={(e) => setForm({ ...form, passage: e.target.value })} className={inputCls} />

        <div className="mt-2 flex items-center justify-between">
          <span className="text-sm font-medium text-[#F8FAFC]">Questions ({questions.length})</span>
          <button type="button" onClick={() => setQuestions([...questions, { ...emptyQ }])} className="inline-flex cursor-pointer items-center gap-1 text-sm text-[#6366F1] hover:text-[#818CF8]">
            <Plus size={14} strokeWidth={1.75} /> Add Question
          </button>
        </div>
        {questions.map((q, i) => (
          <div key={i} className="grid grid-cols-2 gap-2 rounded-lg border-[0.5px] border-[#2A3150] bg-[#12172B] p-3 sm:grid-cols-5">
            <input type="number" placeholder="Q#" value={q.questionNumber} onChange={(e) => updateQ(i, "questionNumber", e.target.value)} className={inputCls} />
            <select value={q.questionType} onChange={(e) => updateQ(i, "questionType", e.target.value)} className={inputCls}>
              {questionTypes.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
            <input placeholder="Question text" value={q.questionText} onChange={(e) => updateQ(i, "questionText", e.target.value)} className={`${inputCls} sm:col-span-3`} />
            <input placeholder="Options (comma sep)" value={q.options} onChange={(e) => updateQ(i, "options", e.target.value)} className={`${inputCls} sm:col-span-2`} />
            <input placeholder="Correct answer" value={q.correctAnswer} onChange={(e) => updateQ(i, "correctAnswer", e.target.value)} className={inputCls} />
            <button type="button" onClick={() => setQuestions(questions.filter((_, j) => j !== i))} className="cursor-pointer text-[#64748B] hover:text-[#EF4444]">
              <Trash2 size={14} strokeWidth={1.75} />
            </button>
          </div>
        ))}
        <button type="submit" className="cursor-pointer rounded-lg bg-[#6366F1] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#818CF8]">Save Reading Passage</button>
      </form>

      <div className="mt-6 flex flex-col gap-2">
        {items.map((item) => (
          <div key={item._id} className="flex items-center justify-between rounded-lg border-[0.5px] border-[#2A3150] bg-[#1E2540] px-4 py-3">
            <div className="min-w-0">
              <p className="text-sm font-medium text-[#F8FAFC]">{item.title}</p>
              <p className="text-xs text-[#64748B]">Book {item.bookNumber} - Test {item.testNumber} - Part {item.partNumber} - {item.questions.length} Qs</p>
            </div>
            <button onClick={() => handleDelete(item._id)} className="cursor-pointer text-[#64748B] transition-colors hover:text-[#EF4444]"><Trash2 size={16} strokeWidth={1.75} /></button>
          </div>
        ))}
        {items.length === 0 && <p className="py-4 text-center text-sm text-[#64748B]">No reading passages yet</p>}
      </div>
    </div>
  );
}

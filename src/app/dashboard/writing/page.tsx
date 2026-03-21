"use client";

import { useState, useEffect } from "react";
import WritingBookList from "@/components/writing/WritingBookList";

interface WritingTask {
  _id: string;
  bookNumber: number;
  testNumber: number;
  taskType: "task1" | "task2";
  title: string;
  instructions: string;
}

interface BookGroup {
  bookNumber: number;
  name: string;
  tasks: WritingTask[];
  task1Count: number;
  task2Count: number;
}

const descriptions = {
  task1: "Describe graphs, charts, tables, or diagrams. Write at least 150 words in about 20 minutes.",
  task2: "Write an essay in response to a point of view, argument, or problem. Write at least 250 words in about 40 minutes.",
};

export default function WritingPage() {
  const [active, setActive] = useState<"task1" | "task2">("task1");
  const [books, setBooks] = useState<BookGroup[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchTasks() {
      try {
        const res = await fetch("/api/content/writing");
        const tasks: WritingTask[] = await res.json();

        const grouped = new Map<number, BookGroup>();
        for (const task of tasks) {
          if (!grouped.has(task.bookNumber)) {
            grouped.set(task.bookNumber, {
              bookNumber: task.bookNumber,
              name: `IELTS Book ${task.bookNumber}`,
              tasks: [],
              task1Count: 0,
              task2Count: 0,
            });
          }
          const group = grouped.get(task.bookNumber)!;
          group.tasks.push(task);
          if (task.taskType === "task1") group.task1Count++;
          else group.task2Count++;
        }

        setBooks(Array.from(grouped.values()).sort((a, b) => a.bookNumber - b.bookNumber));
      } catch {
        // empty
      } finally {
        setLoading(false);
      }
    }
    fetchTasks();
  }, []);

  const filteredBooks = books.filter((b) =>
    active === "task1" ? b.task1Count > 0 : b.task2Count > 0
  );

  return (
    <>
      <div className="animate-fade-up">
        <h1 className="font-heading text-[28px] font-bold text-[#F8FAFC]">
          Writing Lab
        </h1>
        <p className="mt-1 text-sm text-[#94A3B8]">
          Practice IELTS Academic Writing Tasks
        </p>
      </div>

      <div className="animate-fade-up animate-fade-up-1 mt-6 inline-flex rounded-xl bg-[#1E2540] p-1">
        <button
          onClick={() => setActive("task1")}
          className={`cursor-pointer rounded-lg px-6 py-2.5 text-center transition-all duration-200 ${
            active === "task1"
              ? "bg-[#6366F1] text-white"
              : "text-[#94A3B8] hover:text-[#F8FAFC]"
          }`}
        >
          <span className="block text-sm font-medium">Task 1</span>
          <span className="block text-[11px] opacity-80">Graph/Chart</span>
        </button>
        <button
          onClick={() => setActive("task2")}
          className={`cursor-pointer rounded-lg px-6 py-2.5 text-center transition-all duration-200 ${
            active === "task2"
              ? "bg-[#6366F1] text-white"
              : "text-[#94A3B8] hover:text-[#F8FAFC]"
          }`}
        >
          <span className="block text-sm font-medium">Task 2</span>
          <span className="block text-[11px] opacity-80">Essay</span>
        </button>
      </div>

      <p className="animate-fade-up animate-fade-up-2 mt-4 mb-6 text-sm text-[#94A3B8]">
        {descriptions[active]}
      </p>

      <WritingBookList books={filteredBooks} loading={loading} taskType={active} />
    </>
  );
}

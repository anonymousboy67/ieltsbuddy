"use client";

import { useState } from "react";
import WritingBookList from "./WritingBookList";

const descriptions = {
  task1:
    "Describe graphs, charts, tables, or diagrams. Write at least 150 words in about 20 minutes.",
  task2:
    "Write an essay in response to a point of view, argument, or problem. Write at least 250 words in about 40 minutes.",
};

export default function TaskToggle() {
  const [active, setActive] = useState<"task1" | "task2">("task1");

  return (
    <>
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

      <WritingBookList />
    </>
  );
}

"use client";

import { useState } from "react";
import { Save, Send } from "lucide-react";

interface WritingEditorProps {
  minWords: number;
}

function countWords(text: string): number {
  return text.trim() === "" ? 0 : text.trim().split(/\s+/).length;
}

export default function WritingEditor({ minWords }: WritingEditorProps) {
  const [text, setText] = useState("");
  const wordCount = countWords(text);
  const metGoal = wordCount >= minWords;

  return (
    <div className="animate-fade-up animate-fade-up-2 mt-5">
      <label
        htmlFor="writing-response"
        className="text-base font-semibold text-[#F8FAFC]"
      >
        Your Response
      </label>

      <textarea
        id="writing-response"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Start writing your response here..."
        className="mt-3 min-h-[300px] w-full resize-y rounded-xl border-[0.5px] border-[#2A3150] bg-[#12172B] p-4 text-[15px] text-[#F8FAFC] outline-none transition-colors duration-200 placeholder:text-[#64748B] focus:border-[#6366F1]"
      />

      <p
        className={`mt-2 text-right text-[13px] transition-colors duration-200 ${
          metGoal ? "text-[#22C55E]" : "text-[#64748B]"
        }`}
      >
        {wordCount} / {minWords} words
      </p>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <button className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl border-[0.5px] border-[#2A3150] px-6 py-3 text-[15px] font-medium text-[#94A3B8] transition-all duration-200 hover:border-[#6366F1] hover:text-white sm:flex-1">
          <Save size={18} strokeWidth={1.75} />
          Save Draft
        </button>
        <button className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#6366F1] px-6 py-3 text-[15px] font-medium text-white transition-colors duration-200 hover:bg-[#818CF8] sm:flex-1">
          <Send size={18} strokeWidth={1.75} />
          Submit for Review
        </button>
      </div>
    </div>
  );
}

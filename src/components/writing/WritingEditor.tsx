"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Save, Send, Loader2 } from "lucide-react";

interface WritingEditorProps {
  minWords: number;
  taskInstructions: string;
  taskType: "task1" | "task2";
}

function countWords(text: string): number {
  return text.trim() === "" ? 0 : text.trim().split(/\s+/).length;
}

export default function WritingEditor({
  minWords,
  taskInstructions,
  taskType,
}: WritingEditorProps) {
  const [text, setText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const wordCount = countWords(text);
  const metGoal = wordCount >= minWords;

  async function handleSubmit() {
    if (!text.trim()) return;
    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/evaluate/writing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          taskInstructions,
          studentResponse: text,
          taskType,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Evaluation failed");
      }

      const evaluation = await res.json();
      localStorage.setItem("writingEvaluation", JSON.stringify(evaluation));
      router.push("/dashboard/writing/result");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Something went wrong. Please try again."
      );
      setIsSubmitting(false);
    }
  }

  if (isSubmitting) {
    return (
      <div className="panel animate-fade-up animate-fade-up-2 mt-5 flex min-h-[300px] flex-col items-center justify-center gap-4 p-8">
        <Loader2
          size={40}
          strokeWidth={1.75}
          className="animate-spin text-emerald-700"
        />
        <div className="text-center">
          <p className="text-[15px] font-medium text-stone-800">
            AI is evaluating your response...
          </p>
          <p className="animate-loading-pulse mt-2 text-[13px] text-stone-500">
            This may take a few seconds
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-up animate-fade-up-2 mt-5">
      <label
        htmlFor="writing-response"
        className="text-base font-semibold text-stone-800"
      >
        Your Response
      </label>

      <textarea
        id="writing-response"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Start writing your response here..."
        className="mt-3 min-h-[300px] w-full resize-y rounded-xl border border-stone-200 bg-[#FDF8F2] p-4 text-[15px] text-stone-800 outline-none transition-colors duration-200 placeholder:text-stone-400 focus:border-emerald-700"
      />

      <p
        className={`mt-2 text-right text-[13px] transition-colors duration-200 ${
          metGoal ? "text-emerald-700" : "text-stone-500"
        }`}
      >
        {wordCount} / {minWords} words
      </p>

      {error && (
        <p className="mt-2 text-[13px] text-[#B91C1C]">{error}</p>
      )}

      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <button className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-stone-200 bg-stone-100 px-6 py-3 text-[15px] font-medium text-stone-700 transition-all duration-200 hover:bg-stone-200 sm:flex-1">
          <Save size={18} strokeWidth={1.75} />
          Save Draft
        </button>
        <button
          onClick={handleSubmit}
          disabled={!text.trim()}
          className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-emerald-700 px-6 py-3 text-[15px] font-medium text-white transition-colors duration-200 hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-50 sm:flex-1"
        >
          <Send size={18} strokeWidth={1.75} />
          Submit for Review
        </button>
      </div>
    </div>
  );
}

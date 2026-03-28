"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Save, Send, Loader2 } from "lucide-react";
import { useSession } from "next-auth/react";
import { socket } from "@/lib/socket";

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
  const { data: session } = useSession();
  const [text, setText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const wordCount = countWords(text);
  const metGoal = wordCount >= minWords;

  useEffect(() => {
    if (session?.user?.id && isSubmitting) {
      if (!socket.connected) socket.connect();
      
      socket.emit("join-user-room", session.user.id);

      const handleReady = (data: { attemptId: string }) => {
        console.log("Evaluation ready event received:", data);
        // Clean up local storage as the new result will be fetched on the result page
        localStorage.removeItem("writingEvaluation"); 
        router.push(`/dashboard/writing/result?attemptId=${data.attemptId}`);
      };

      socket.on("evaluation-ready", handleReady);

      return () => {
        socket.off("evaluation-ready", handleReady);
      };
    }
  }, [session, isSubmitting, router]);

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

      // Instead of waiting here, we wait for the Socket.io event in useEffect
      console.log("Job queued successfully 🚀");
      
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Something went wrong. Please try again."
      );
      setIsSubmitting(false);
    }
  }
// ... rest of the component (truncated for brevity)

  if (isSubmitting) {
    return (
      <div className="animate-fade-up animate-fade-up-2 mt-5 flex min-h-[300px] flex-col items-center justify-center gap-4 rounded-xl border-[0.5px] border-[#2A3150] bg-[#1E2540] p-8">
        <Loader2
          size={40}
          strokeWidth={1.75}
          className="animate-spin text-[#6366F1]"
        />
        <div className="text-center">
          <p className="text-[15px] font-medium text-[#F8FAFC]">
            AI is evaluating your response...
          </p>
          <p className="animate-loading-pulse mt-2 text-[13px] text-[#64748B]">
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

      {error && (
        <p className="mt-2 text-[13px] text-[#EF4444]">{error}</p>
      )}

      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <button className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl border-[0.5px] border-[#2A3150] px-6 py-3 text-[15px] font-medium text-[#94A3B8] transition-all duration-200 hover:border-[#6366F1] hover:text-white sm:flex-1">
          <Save size={18} strokeWidth={1.75} />
          Save Draft
        </button>
        <button
          onClick={handleSubmit}
          disabled={!text.trim()}
          className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#6366F1] px-6 py-3 text-[15px] font-medium text-white transition-colors duration-200 hover:bg-[#818CF8] disabled:cursor-not-allowed disabled:opacity-50 sm:flex-1"
        >
          <Send size={18} strokeWidth={1.75} />
          Submit for Review
        </button>
      </div>
    </div>
  );
}

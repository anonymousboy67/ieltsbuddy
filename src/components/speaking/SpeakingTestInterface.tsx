"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Clock, ChevronLeft, ChevronRight } from "lucide-react";
import MicVisualizer from "./MicVisualizer";
import QuestionCard from "./QuestionCard";

type MicState = "idle" | "listening" | "processing";

const parts = [
  {
    label: "Part 1",
    desc: "Introduction & Interview - The examiner will ask general questions about yourself and familiar topics.",
    questions: [
      "Can you tell me about your hometown? What is it like to live there?",
      "Do you work or are you a student? What do you enjoy about it?",
      "What do you like to do in your free time?",
      "How important is family in your culture?",
    ],
  },
  {
    label: "Part 2",
    desc: "Individual Long Turn - You will be given a topic card and have 1 minute to prepare, then speak for 1-2 minutes.",
    questions: [
      "Describe a place you have visited that you found very beautiful. You should say: where it is, when you visited, what you did there, and explain why you found it beautiful.",
    ],
  },
  {
    label: "Part 3",
    desc: "Two-way Discussion - The examiner will ask deeper questions related to the Part 2 topic.",
    questions: [
      "Do you think tourism has a positive or negative effect on beautiful places?",
      "How can governments balance tourism with environmental protection?",
      "Why do people feel the need to travel to beautiful places?",
    ],
  },
];

export default function SpeakingTestInterface() {
  const [partIdx, setPartIdx] = useState(0);
  const [qIdx, setQIdx] = useState(0);
  const [micState, setMicState] = useState<MicState>("idle");

  const part = parts[partIdx];
  const totalQ = part.questions.length;
  const isLastQ = qIdx === totalQ - 1;

  const toggleMic = () => {
    setMicState((s) => (s === "listening" ? "idle" : "listening"));
  };

  const nextQuestion = () => {
    if (isLastQ) {
      if (partIdx < parts.length - 1) {
        setPartIdx(partIdx + 1);
        setQIdx(0);
        setMicState("idle");
      }
    } else {
      setQIdx(qIdx + 1);
      setMicState("idle");
    }
  };

  return (
    <div>
      <div className="animate-fade-up flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/speaking"
            className="flex h-10 w-10 items-center justify-center rounded-full border-[0.5px] border-[#2A3150] bg-[#1E2540] transition-all duration-200 hover:border-[rgba(99,102,241,0.3)]"
          >
            <ArrowLeft size={20} strokeWidth={1.75} className="text-[#94A3B8]" />
          </Link>
          <h1 className="text-base font-medium text-[#F8FAFC]">
            Speaking Test - {part.label}
          </h1>
        </div>
        <span className="flex items-center gap-1.5 text-sm text-[#64748B]">
          <Clock size={16} strokeWidth={1.75} />
          00:00
        </span>
      </div>

      <div className="animate-fade-up animate-fade-up-1 mt-6 flex gap-2">
        {parts.map((p, i) => (
          <button
            key={i}
            onClick={() => { setPartIdx(i); setQIdx(0); setMicState("idle"); }}
            className={`cursor-pointer rounded-full px-4 py-1.5 text-[13px] font-medium transition-all duration-200 ${
              i === partIdx
                ? "bg-[#6366F1] text-white"
                : "bg-[#1E2540] text-[#94A3B8] hover:text-[#F8FAFC]"
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      <p className="animate-fade-up animate-fade-up-2 mt-3 text-sm text-[#94A3B8]">
        {part.desc}
      </p>

      <div key={`${partIdx}-${qIdx}`} className="animate-step-enter">
        <QuestionCard
          questionIndex={qIdx}
          totalQuestions={totalQ}
          questionText={part.questions[qIdx]}
        />
      </div>

      <MicVisualizer state={micState} onToggle={toggleMic} />

      <div className="mt-6 rounded-xl bg-[#12172B] p-4">
        <p className="text-sm font-medium text-[#64748B]">Your Response</p>
        <p className="mt-2 text-sm italic text-[#94A3B8]">
          Your spoken response will appear here after you finish speaking...
        </p>
      </div>

      <div className="mt-6 flex gap-3 pb-4">
        <button
          onClick={() => { if (qIdx > 0) { setQIdx(qIdx - 1); setMicState("idle"); } }}
          disabled={qIdx === 0}
          className="inline-flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl border-[0.5px] border-[#2A3150] py-3 text-[15px] font-medium text-[#94A3B8] transition-all duration-200 hover:border-[#6366F1] hover:text-white disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-[#2A3150] disabled:hover:text-[#94A3B8]"
        >
          <ChevronLeft size={18} strokeWidth={1.75} />
          Previous
        </button>
        <button
          onClick={nextQuestion}
          className="inline-flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#6366F1] py-3 text-[15px] font-medium text-white transition-colors duration-200 hover:bg-[#818CF8]"
        >
          {isLastQ && partIdx === parts.length - 1
            ? "Finish Test"
            : isLastQ
              ? `Finish ${part.label}`
              : "Next Question"}
          {!isLastQ && <ChevronRight size={18} strokeWidth={1.75} />}
        </button>
      </div>
    </div>
  );
}

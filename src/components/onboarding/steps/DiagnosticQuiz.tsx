"use client";

import { useEffect, useState } from "react";
import { Clock, CheckCircle } from "lucide-react";

interface Question {
  id: number;
  skill: "reading" | "listening" | "writing";
  question: string;
  options?: string[];
  type: "mcq" | "short";
}

const QUESTIONS: Question[] = [
  {
    id: 1,
    skill: "reading",
    type: "mcq",
    question: "The graph below shows changes in the population of three cities between 1990 and 2020. According to the graph, which city showed the MOST consistent growth?",
    options: [
      "City A, which grew steadily throughout the period",
      "City B, which had fluctuations but ended higher",
      "City C, which declined then recovered sharply",
      "All cities showed equal growth",
    ],
  },
  {
    id: 2,
    skill: "listening",
    type: "mcq",
    question: "A speaker says: \"While the results are promising, we must acknowledge the limitations of our sample size before drawing any firm conclusions.\" What is the speaker's main point?",
    options: [
      "The results are completely unreliable",
      "The results need qualification due to methodological constraints",
      "The sample size was adequate for the study",
      "No conclusions can ever be drawn from this research",
    ],
  },
  {
    id: 3,
    skill: "writing",
    type: "short",
    question: "In 2-3 sentences, summarize the main function of renewable energy in addressing climate change. Use formal academic language.",
  },
  {
    id: 4,
    skill: "reading",
    type: "mcq",
    question: "Choose the word that BEST completes this academic sentence: The study's findings were _____ by subsequent research conducted over the following decade.",
    options: ["corroborated", "dismissed", "ignored", "complicated by"],
  },
  {
    id: 5,
    skill: "writing",
    type: "short",
    question: "Describe ONE advantage and ONE disadvantage of remote working. Write in 2 sentences using formal language.",
  },
];

const TOTAL_TIME = 5 * 60; // 5 minutes in seconds

const SKILL_COLORS: Record<string, string> = {
  reading: "#6366F1",
  listening: "#22C55E",
  writing: "#F59E0B",
};

interface DiagnosticQuizProps {
  answers: Record<number, string>;
  onChange: (answers: Record<number, string>) => void;
}

export default function DiagnosticQuiz({ answers, onChange }: DiagnosticQuizProps) {
  const [timeLeft, setTimeLeft] = useState(TOTAL_TIME);
  const [currentQ, setCurrentQ] = useState(0);

  useEffect(() => {
    if (timeLeft <= 0) return;
    const t = setInterval(() => setTimeLeft((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(t);
  }, [timeLeft]);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60).toString().padStart(2, "0");
    const sec = (s % 60).toString().padStart(2, "0");
    return `${m}:${sec}`;
  };

  const q = QUESTIONS[currentQ];
  const answeredCount = Object.keys(answers).length;
  const isUrgent = timeLeft < 60;

  const handleAnswer = (value: string) => {
    onChange({ ...answers, [q.id]: value });
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="text-center">
        <div className="inline-flex items-center gap-1.5 rounded-full bg-[rgba(99,102,241,0.12)] px-3 py-1 text-xs font-medium text-[#6366F1]">
          ⚡ Quick Diagnostic
        </div>
        <h2 className="mt-3 font-heading text-2xl font-bold text-[#F8FAFC]">
          Skill Assessment
        </h2>
        <p className="mt-1 text-sm text-[#94A3B8]">
          5 questions · helps us build your personalised study plan
        </p>
      </div>

      {/* Timer */}
      <div className={`flex items-center justify-between rounded-xl border-[0.5px] px-4 py-3 ${
        isUrgent
          ? "border-[rgba(239,68,68,0.4)] bg-[rgba(239,68,68,0.08)]"
          : "border-[#2A3150] bg-[#1E2540]"
      }`}>
        <div className="flex items-center gap-2">
          <Clock size={16} className={isUrgent ? "text-[#EF4444]" : "text-[#94A3B8]"} strokeWidth={1.75} />
          <span className="text-xs text-[#94A3B8]">Time remaining</span>
        </div>
        <span className={`font-mono text-lg font-bold ${isUrgent ? "text-[#EF4444] animate-pulse" : "text-[#F8FAFC]"}`}>
          {formatTime(timeLeft)}
        </span>
      </div>

      {/* Question navigation pills */}
      <div className="flex gap-2">
        {QUESTIONS.map((question, i) => (
          <button
            key={question.id}
            onClick={() => setCurrentQ(i)}
            className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-medium transition-all ${
              i === currentQ
                ? "bg-[#6366F1] text-white"
                : answers[question.id]
                  ? "bg-[rgba(34,197,94,0.15)] text-[#22C55E]"
                  : "bg-[#1E2540] text-[#64748B]"
            }`}
          >
            {answers[question.id] ? <CheckCircle size={14} /> : i + 1}
          </button>
        ))}
      </div>

      {/* Question card */}
      <div
        key={q.id}
        className="rounded-xl border-[0.5px] bg-[#1E2540] p-5"
        style={{ borderColor: `${SKILL_COLORS[q.skill]}33` }}
      >
        <div className="mb-3 flex items-center gap-2">
          <span
            className="rounded-full px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-wider"
            style={{ color: SKILL_COLORS[q.skill], backgroundColor: `${SKILL_COLORS[q.skill]}18` }}
          >
            {q.skill}
          </span>
          <span className="text-xs text-[#64748B]">Q{q.id} of {QUESTIONS.length}</span>
        </div>

        <p className="text-sm leading-relaxed text-[#E2E8F0]">{q.question}</p>

        {q.type === "mcq" && q.options && (
          <div className="mt-4 space-y-2">
            {q.options.map((opt, i) => (
              <button
                key={i}
                onClick={() => handleAnswer(opt)}
                className={`w-full rounded-lg border-[0.5px] px-4 py-3 text-left text-sm transition-all ${
                  answers[q.id] === opt
                    ? "border-[#6366F1] bg-[rgba(99,102,241,0.12)] text-white"
                    : "border-[#2A3150] text-[#94A3B8] hover:border-[#6366F1] hover:text-white"
                }`}
              >
                <span className="mr-2 font-medium text-[#6366F1]">{String.fromCharCode(65 + i)}.</span>
                {opt}
              </button>
            ))}
          </div>
        )}

        {q.type === "short" && (
          <textarea
            value={answers[q.id] || ""}
            onChange={(e) => handleAnswer(e.target.value)}
            placeholder="Write your response here..."
            rows={4}
            className="mt-4 w-full rounded-lg border-[0.5px] border-[#2A3150] bg-[#12172B] p-3 text-sm text-[#F8FAFC] placeholder-[#64748B] outline-none transition-all focus:border-[#6366F1] resize-none"
          />
        )}
      </div>

      {/* Navigation */}
      <div className="flex gap-3">
        {currentQ > 0 && (
          <button
            onClick={() => setCurrentQ(currentQ - 1)}
            className="flex-1 rounded-xl border-[0.5px] border-[#2A3150] py-3 text-sm text-[#94A3B8] transition-all hover:border-[#6366F1] hover:text-white"
          >
            Previous
          </button>
        )}
        {currentQ < QUESTIONS.length - 1 && (
          <button
            onClick={() => setCurrentQ(currentQ + 1)}
            className="flex-1 rounded-xl bg-[#6366F1] py-3 text-sm font-medium text-white transition-all hover:bg-[#818CF8]"
          >
            Next Question
          </button>
        )}
      </div>

      <p className="text-center text-xs text-[#64748B]">
        {answeredCount} of {QUESTIONS.length} answered · Click &quot;Continue&quot; when ready
      </p>
    </div>
  );
}

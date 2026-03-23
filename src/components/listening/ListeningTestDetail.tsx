"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, List, HelpCircle, Headphones } from "lucide-react";

interface Part {
  partNumber: number;
  title?: string;
  totalQuestions: number;
  audioUrl?: string;
  questionGroups?: unknown[];
}

interface ListeningTestDetailProps {
  bookNumber: number;
  testNumber: number;
}

const PART_DESCRIPTIONS = [
  "A conversation between two people set in an everyday social context.",
  "A monologue set in an everyday social context, e.g. a speech about local facilities.",
  "A conversation between up to four people set in an educational or training context.",
  "A monologue on an academic subject, e.g. a university lecture.",
];

const staggerClass = [
  "animate-fade-up-4",
  "animate-fade-up-5",
  "animate-fade-up-6",
  "animate-fade-up-7",
];

export default function ListeningTestDetail({
  bookNumber,
  testNumber,
}: ListeningTestDetailProps) {
  const router = useRouter();
  const [parts, setParts] = useState<Part[]>([]);
  const [loading, setLoading] = useState(true);
  const [audioControls, setAudioControls] = useState(false);

  useEffect(() => {
    fetch(`/api/listening/${bookNumber}/${testNumber}`)
      .then((r) => r.json())
      .then((data) => setParts(Array.isArray(data) ? data : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [bookNumber, testNumber]);

  const totalQuestions = parts.reduce((sum, p) => sum + p.totalQuestions, 0);
  const title = `IELTS Book ${bookNumber} Test ${testNumber}`;

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 animate-pulse rounded-full bg-[#1E2540]" />
          <div className="h-5 w-48 animate-pulse rounded bg-[#1E2540]" />
        </div>
        <div className="h-40 animate-pulse rounded-xl bg-[#1E2540]" />
        <div className="h-16 animate-pulse rounded-xl bg-[#1E2540]" />
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-20 animate-pulse rounded-xl bg-[#1E2540]" />
        ))}
      </div>
    );
  }

  if (parts.length === 0) {
    return (
      <div className="flex min-h-[300px] flex-col items-center justify-center gap-4">
        <p className="text-[15px] text-[#94A3B8]">Test not found</p>
        <Link
          href="/dashboard/listening"
          className="rounded-xl bg-[#6366F1] px-6 py-3 text-sm font-medium text-white hover:bg-[#818CF8]"
        >
          Back to Listening
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div className="animate-fade-up flex items-center gap-3">
        <Link
          href="/dashboard/listening"
          className="flex h-10 w-10 items-center justify-center rounded-full border-[0.5px] border-[#2A3150] bg-[#1E2540] transition-all duration-200 hover:border-[rgba(99,102,241,0.3)]"
        >
          <ArrowLeft size={20} strokeWidth={1.75} className="text-[#94A3B8]" />
        </Link>
        <h1 className="text-base font-medium text-[#F8FAFC]">{title}</h1>
      </div>

      <div className="animate-fade-up animate-fade-up-1 mt-6 rounded-xl border-[0.5px] border-[#2A3150] bg-[#1E2540] p-5">
        <h2 className="font-heading text-xl font-bold text-[#F8FAFC]">
          {title}
        </h2>
        <div className="mt-2 flex items-center gap-2 text-sm">
          <span className="flex items-center gap-1.5 text-[#22C55E]">
            <List size={14} strokeWidth={1.75} />
            {parts.length} Sections
          </span>
          <span className="text-[#2A3150]">-</span>
          <span className="flex items-center gap-1.5 text-[#64748B]">
            <HelpCircle size={14} strokeWidth={1.75} />
            {totalQuestions} Questions
          </span>
        </div>
        <p className="mt-3 text-sm text-[#94A3B8]">
          The Listening test takes approximately 30-40 minutes. You will hear
          four recordings of native English speakers and then write your answers
          to a series of questions.
        </p>
      </div>

      <div className="animate-fade-up animate-fade-up-2 mt-4 flex items-center justify-between rounded-xl border-[0.5px] border-[#2A3150] bg-[#1E2540] p-4">
        <div className="min-w-0">
          <p className="text-[15px] font-medium text-[#F8FAFC]">
            Enable Audio Controls
          </p>
          <p className="mt-0.5 text-[13px] text-[#64748B]">
            Allow pausing, rewinding, and fast-forwarding.
          </p>
        </div>
        <button
          onClick={() => setAudioControls(!audioControls)}
          className={`relative ml-4 h-7 w-12 flex-shrink-0 cursor-pointer rounded-full transition-colors duration-200 ${
            audioControls ? "bg-[#6366F1]" : "bg-[#2A3150]"
          }`}
          role="switch"
          aria-checked={audioControls}
        >
          <span
            className={`absolute top-1 left-1 h-5 w-5 rounded-full bg-white transition-transform duration-200 ${
              audioControls ? "translate-x-5" : "translate-x-0"
            }`}
          />
        </button>
      </div>

      <section className="mt-6">
        <h2 className="animate-fade-up animate-fade-up-3 font-heading text-lg font-semibold text-[#F8FAFC]">
          Test Structure
        </h2>
        <div className="mt-4 flex flex-col gap-3">
          {parts.map((p, i) => (
            <div
              key={p.partNumber}
              className={`animate-fade-up ${staggerClass[i] || ""} rounded-xl border-[0.5px] border-[#2A3150] bg-[#1E2540] p-4`}
            >
              <div className="flex items-center justify-between">
                <span className="text-base font-semibold text-[#F8FAFC]">
                  Part {p.partNumber}
                  {p.title ? `: ${p.title}` : ""}
                </span>
                <span className="text-sm text-[#64748B]">
                  {p.totalQuestions} Questions
                </span>
              </div>
              <p className="mt-2 text-[13px] text-[#94A3B8]">
                {PART_DESCRIPTIONS[p.partNumber - 1] || ""}
              </p>
            </div>
          ))}
        </div>
      </section>

      <button
        onClick={() =>
          router.push(
            `/dashboard/listening/test/${bookNumber}/${testNumber}?controls=${audioControls}`
          )
        }
        className="mt-6 flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#6366F1] py-3.5 text-[15px] font-medium text-white transition-colors duration-200 hover:bg-[#818CF8]"
      >
        <Headphones size={18} strokeWidth={1.75} />
        Start Test
      </button>
    </div>
  );
}

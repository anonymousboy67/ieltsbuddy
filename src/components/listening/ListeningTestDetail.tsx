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
          <div className="h-10 w-10 animate-pulse rounded-full bg-stone-200" />
          <div className="h-5 w-48 animate-pulse rounded bg-stone-200" />
        </div>
        <div className="h-40 animate-pulse rounded-xl bg-stone-200" />
        <div className="h-16 animate-pulse rounded-xl bg-stone-200" />
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-20 animate-pulse rounded-xl bg-stone-200" />
        ))}
      </div>
    );
  }

  if (parts.length === 0) {
    return (
      <div className="flex min-h-[300px] flex-col items-center justify-center gap-4">
        <p className="text-[15px] text-stone-600">Test not found</p>
        <Link
          href="/dashboard/listening"
          className="rounded-xl bg-emerald-700 px-6 py-3 text-sm font-medium text-white hover:bg-teal-700"
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
          className="flex h-10 w-10 items-center justify-center rounded-full border border-stone-200 bg-[#FDF8F2] transition-all duration-200 hover:bg-stone-100"
        >
          <ArrowLeft size={20} strokeWidth={1.75} className="text-stone-600" />
        </Link>
        <h1 className="text-base font-medium text-stone-800">{title}</h1>
      </div>

      <div className="panel animate-fade-up animate-fade-up-1 mt-6 p-5">
        <h2 className="font-heading text-xl font-bold text-stone-800">
          {title}
        </h2>
        <div className="mt-2 flex items-center gap-2 text-sm">
          <span className="flex items-center gap-1.5 text-emerald-700">
            <List size={14} strokeWidth={1.75} />
            {parts.length} Sections
          </span>
          <span className="text-stone-300">-</span>
          <span className="flex items-center gap-1.5 text-stone-500">
            <HelpCircle size={14} strokeWidth={1.75} />
            {totalQuestions} Questions
          </span>
        </div>
        <p className="mt-3 text-sm text-stone-600">
          The Listening test takes approximately 30-40 minutes. You will hear
          four recordings of native English speakers and then write your answers
          to a series of questions.
        </p>
      </div>

      <div className="panel animate-fade-up animate-fade-up-2 mt-4 flex items-center justify-between p-4">
        <div className="min-w-0">
          <p className="text-[15px] font-medium text-stone-800">
            Enable Audio Controls
          </p>
          <p className="mt-0.5 text-[13px] text-stone-500">
            Allow pausing, rewinding, and fast-forwarding.
          </p>
        </div>
        <button
          onClick={() => setAudioControls(!audioControls)}
          className={`relative ml-4 h-7 w-12 flex-shrink-0 cursor-pointer rounded-full transition-colors duration-200 ${
            audioControls ? "bg-emerald-700" : "bg-stone-300"
          }`}
          role="switch"
          aria-checked={audioControls}
        >
          <span
            className={`absolute top-1 left-1 h-5 w-5 rounded-full bg-[#FDF8F2] transition-transform duration-200 ${
              audioControls ? "translate-x-5" : "translate-x-0"
            }`}
          />
        </button>
      </div>

      <section className="mt-6">
        <h2 className="animate-fade-up animate-fade-up-3 font-heading text-lg font-semibold text-stone-800">
          Test Structure
        </h2>
        <div className="mt-4 flex flex-col gap-3">
          {parts.map((p, i) => (
            <div
              key={p.partNumber}
              className={`panel animate-fade-up ${staggerClass[i] || ""} p-4`}
            >
              <div className="flex items-center justify-between">
                <span className="text-base font-semibold text-stone-800">
                  Part {p.partNumber}
                  {p.title ? `: ${p.title}` : ""}
                </span>
                <span className="text-sm text-stone-500">
                  {p.totalQuestions} Questions
                </span>
              </div>
              <p className="mt-2 text-[13px] text-stone-600">
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
        className="mt-6 flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-emerald-700 py-3.5 text-[15px] font-medium text-white transition-colors duration-200 hover:bg-teal-700"
      >
        <Headphones size={18} strokeWidth={1.75} />
        Start Test
      </button>
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, BookOpen } from "lucide-react";
import PassageDetail from "./PassageDetail";

interface QuestionGroup {
  groupLabel: string;
  questionType: string;
  questions: { questionNumber: number }[];
}

interface Passage {
  _id: string;
  passageNumber: number;
  title: string;
  topic: string;
  difficulty: string;
  passage: string;
  questionGroups: QuestionGroup[];
}

interface ReadingTestDetailProps {
  bookNumber: number;
  testNumber: number;
}

const difficultyLabel: Record<string, string> = {
  beginner: "Beginner",
  intermediate: "Intermediate",
  advanced: "Advanced",
};

export default function ReadingTestDetail({
  bookNumber,
  testNumber,
}: ReadingTestDetailProps) {
  const [passages, setPassages] = useState<Passage[]>([]);
  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState(0);

  useEffect(() => {
    fetch(`/api/reading/${bookNumber}/${testNumber}`)
      .then((r) => r.json())
      .then((data) => setPassages(Array.isArray(data) ? data : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [bookNumber, testNumber]);

  if (loading) {
    return (
      <div>
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/reading"
            className="flex h-10 w-10 items-center justify-center rounded-full border-[0.5px] border-[#2A3150] bg-[#1E2540]"
          >
            <ArrowLeft size={20} strokeWidth={1.75} className="text-[#94A3B8]" />
          </Link>
          <h1 className="text-base font-medium text-[#F8FAFC]">
            IELTS Book {bookNumber} Test {testNumber}
          </h1>
        </div>
        <p className="mt-6 text-sm text-[#64748B]">Loading...</p>
      </div>
    );
  }

  if (passages.length === 0) {
    return (
      <div>
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/reading"
            className="flex h-10 w-10 items-center justify-center rounded-full border-[0.5px] border-[#2A3150] bg-[#1E2540]"
          >
            <ArrowLeft size={20} strokeWidth={1.75} className="text-[#94A3B8]" />
          </Link>
          <h1 className="text-base font-medium text-[#F8FAFC]">
            IELTS Book {bookNumber} Test {testNumber}
          </h1>
        </div>
        <p className="mt-6 text-center text-sm text-[#64748B]">
          No passages found for this test
        </p>
      </div>
    );
  }

  const currentPassage = passages[active];

  return (
    <div>
      <div className="animate-fade-up flex items-center gap-3">
        <Link
          href="/dashboard/reading"
          className="flex h-10 w-10 items-center justify-center rounded-full border-[0.5px] border-[#2A3150] bg-[#1E2540] transition-all duration-200 hover:border-[rgba(99,102,241,0.3)]"
        >
          <ArrowLeft size={20} strokeWidth={1.75} className="text-[#94A3B8]" />
        </Link>
        <h1 className="text-base font-medium text-[#F8FAFC]">
          IELTS Book {bookNumber} Test {testNumber}
        </h1>
      </div>

      <div className="animate-fade-up animate-fade-up-1 mt-6 flex w-full rounded-xl bg-[#1E2540] p-1">
        {passages.map((p, idx) => (
          <button
            key={p._id}
            onClick={() => setActive(idx)}
            className={`flex-1 cursor-pointer rounded-lg py-2.5 text-center transition-all duration-200 ${
              active === idx
                ? "bg-[#6366F1] text-white"
                : "text-[#94A3B8] hover:text-[#F8FAFC]"
            }`}
          >
            <span className="block text-sm font-medium">Passage {p.passageNumber}</span>
            <span className="block text-[11px] opacity-80">
              {difficultyLabel[p.difficulty] || p.difficulty}
            </span>
          </button>
        ))}
      </div>

      <div className="mt-6">
        <PassageDetail data={currentPassage} />
      </div>

      <div className="mt-8 pb-4">
        <Link
          href={`/dashboard/reading/test/${currentPassage._id}`}
          className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#6366F1] py-3.5 text-[15px] font-medium text-white transition-colors duration-200 hover:bg-[#818CF8]"
        >
          <BookOpen size={18} strokeWidth={1.75} />
          Start Test
        </Link>
      </div>
    </div>
  );
}

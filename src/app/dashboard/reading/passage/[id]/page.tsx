"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, BookOpen, Tag, HelpCircle } from "lucide-react";

interface Question {
  questionNumber: number;
  questionType: string;
  questionText: string;
  options?: string[];
  correctAnswer: string;
}

interface PassageData {
  _id: string;
  bookNumber: number;
  testNumber: number;
  partNumber: number;
  title: string;
  topic: string;
  difficulty: string;
  passage: string;
  questions: Question[];
}

export default function ReadingPassagePage() {
  const { id } = useParams<{ id: string }>();
  const [passage, setPassage] = useState<PassageData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPassage() {
      try {
        const res = await fetch(`/api/content/reading/${id}`);
        if (res.ok) setPassage(await res.json());
      } catch {
        // empty
      } finally {
        setLoading(false);
      }
    }
    fetchPassage();
  }, [id]);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 animate-pulse rounded-full bg-[#1E2540]" />
          <div className="h-5 w-48 animate-pulse rounded bg-[#1E2540]" />
        </div>
        <div className="h-8 w-64 animate-pulse rounded bg-[#1E2540]" />
        <div className="h-48 animate-pulse rounded-xl bg-[#1E2540]" />
        <div className="h-64 animate-pulse rounded-xl bg-[#1E2540]" />
      </div>
    );
  }

  if (!passage) {
    return (
      <div className="flex min-h-[300px] flex-col items-center justify-center gap-4">
        <p className="text-[15px] text-[#94A3B8]">Passage not found</p>
        <Link
          href="/dashboard/reading"
          className="rounded-xl bg-[#6366F1] px-6 py-3 text-sm font-medium text-white hover:bg-[#818CF8]"
        >
          Back to Reading
        </Link>
      </div>
    );
  }

  // Group questions by type
  const questionTypeMap = new Map<string, number>();
  for (const q of passage.questions) {
    questionTypeMap.set(q.questionType, (questionTypeMap.get(q.questionType) || 0) + 1);
  }
  const questionTypes = Array.from(questionTypeMap.entries()).map(([name, count]) => ({
    name,
    count,
  }));

  const preview = passage.passage.slice(0, 300) + (passage.passage.length > 300 ? "..." : "");

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
          Book {passage.bookNumber} Test {passage.testNumber} - Part {passage.partNumber}
        </h1>
      </div>

      <div className="animate-fade-up animate-fade-up-1 mt-6">
        <h2 className="font-heading text-[22px] font-bold text-[#F8FAFC]">
          {passage.title}
        </h2>
        <div className="mt-3 flex flex-wrap items-center gap-4">
          <span className="flex items-center gap-1.5 text-sm text-[#6366F1]">
            <Tag size={14} strokeWidth={1.75} />
            {passage.topic}
          </span>
          <span className="flex items-center gap-1.5 text-sm text-[#64748B]">
            <HelpCircle size={14} strokeWidth={1.75} />
            {passage.questions.length} Questions
          </span>
          <span className="rounded-full bg-[rgba(99,102,241,0.15)] px-2.5 py-0.5 text-[11px] font-medium capitalize text-[#818CF8]">
            {passage.difficulty}
          </span>
        </div>
      </div>

      <section className="animate-fade-up animate-fade-up-2 mt-6">
        <h3 className="text-base font-semibold text-[#F8FAFC]">Question Types</h3>
        <div className="mt-3">
          {questionTypes.map((qt, i) => (
            <div
              key={qt.name}
              className={`flex items-center justify-between py-2.5 ${
                i < questionTypes.length - 1 ? "border-b-[0.5px] border-[#2A3150]" : ""
              }`}
            >
              <span className="flex items-center gap-2.5 text-sm text-[#94A3B8]">
                <span className="h-1.5 w-1.5 rounded-full bg-[#A855F7]" />
                {qt.name}
              </span>
              <span className="text-sm font-medium text-[#64748B]">{qt.count}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="animate-fade-up animate-fade-up-3 mt-6">
        <h3 className="text-base font-semibold text-[#F8FAFC]">Preview</h3>
        <div className="relative mt-3 overflow-hidden rounded-xl border-[0.5px] border-[#2A3150] bg-[#1E2540] p-4">
          <p className="text-sm italic text-[#94A3B8]">{preview}</p>
          <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-[#1E2540] to-transparent" />
        </div>
      </section>

      <div className="animate-fade-up animate-fade-up-4 mt-8 pb-4">
        <button className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#6366F1] py-3.5 text-[15px] font-medium text-white transition-colors duration-200 hover:bg-[#818CF8]">
          <BookOpen size={18} strokeWidth={1.75} />
          Start Test
        </button>
      </div>
    </div>
  );
}

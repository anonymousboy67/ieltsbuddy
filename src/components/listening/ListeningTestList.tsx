"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Headphones,
  ChevronRight,
  List,
  HelpCircle,
} from "lucide-react";

interface ListeningTest {
  bookNumber: number;
  testNumber: number;
  parts: {
    partNumber: number;
    title?: string;
    totalQuestions: number;
    hasAudio: boolean;
  }[];
}

export default function ListeningTestList() {
  const [tests, setTests] = useState<ListeningTest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/listening")
      .then((r) => r.json())
      .then((data) => setTests(Array.isArray(data) ? data : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <section className="mt-6">
        <div className="h-5 w-32 animate-pulse rounded bg-[#1E2540]" />
        <div className="mt-4 flex flex-col gap-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-20 animate-pulse rounded-xl bg-[#1E2540]"
            />
          ))}
        </div>
      </section>
    );
  }

  if (tests.length === 0) {
    return (
      <section className="mt-6">
        <div className="flex min-h-[200px] flex-col items-center justify-center rounded-xl border-[0.5px] border-[#2A3150] bg-[#1E2540] p-8">
          <Headphones size={32} strokeWidth={1.75} className="text-[#64748B]" />
          <p className="mt-3 text-[15px] text-[#94A3B8]">
            No listening tests available yet
          </p>
        </div>
      </section>
    );
  }

  const staggerClass = [
    "animate-fade-up-2",
    "animate-fade-up-3",
    "animate-fade-up-4",
    "animate-fade-up-5",
    "animate-fade-up-6",
    "animate-fade-up-7",
  ];

  return (
    <section className="mt-6">
      <h2 className="animate-fade-up animate-fade-up-1 font-heading text-lg font-semibold text-[#F8FAFC]">
        Available Tests
      </h2>
      <div className="mt-4 flex flex-col gap-3">
        {tests.map((test, i) => {
          const totalQuestions = test.parts.reduce(
            (sum, p) => sum + p.totalQuestions,
            0
          );
          return (
            <Link
              key={`${test.bookNumber}-${test.testNumber}`}
              href={`/dashboard/listening/${test.bookNumber}/${test.testNumber}`}
              className={`animate-fade-up ${staggerClass[i] || ""} group flex cursor-pointer items-center gap-4 rounded-xl border-[0.5px] border-[#2A3150] bg-[#1E2540] p-4 transition-all duration-200 ease-out hover:-translate-y-0.5 hover:border-[rgba(99,102,241,0.3)]`}
            >
              <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-[rgba(34,197,94,0.15)]">
                <Headphones
                  size={20}
                  strokeWidth={1.75}
                  className="text-[#22C55E]"
                />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[15px] font-medium text-[#F8FAFC]">
                  IELTS Book {test.bookNumber} Test {test.testNumber}
                </p>
                <div className="mt-1 flex items-center gap-4">
                  <span className="flex items-center gap-1.5 text-[13px] text-[#64748B]">
                    <List size={14} strokeWidth={1.75} />
                    {test.parts.length} Sections
                  </span>
                  <span className="flex items-center gap-1.5 text-[13px] text-[#64748B]">
                    <HelpCircle size={14} strokeWidth={1.75} />
                    {totalQuestions} Questions
                  </span>
                </div>
              </div>
              <ChevronRight
                size={20}
                strokeWidth={1.75}
                className="flex-shrink-0 text-[#64748B] transition-transform duration-200 group-hover:translate-x-0.5"
              />
            </Link>
          );
        })}
      </div>
    </section>
  );
}

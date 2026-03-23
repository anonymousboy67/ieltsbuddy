"use client";

import Link from "next/link";
import { BookOpen, ChevronRight } from "lucide-react";

interface ReadingPassage {
  _id: string;
  bookNumber: number;
  testNumber: number;
  passageNumber?: number;
  partNumber?: number;
  title: string;
}

interface ReadingTestGroup {
  key: string;
  name: string;
  bookNumber: number;
  testNumber: number;
  passages: ReadingPassage[];
  firstPassageId: string;
}

interface ReadingTestListProps {
  tests: ReadingTestGroup[];
  loading: boolean;
}

export default function ReadingTestList({ tests, loading }: ReadingTestListProps) {
  if (loading) {
    return (
      <div className="mt-6 space-y-3">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-24 animate-pulse rounded-xl border-[0.5px] border-[#2A3150] bg-[#1E2540]"
          />
        ))}
      </div>
    );
  }

  if (tests.length === 0) {
    return (
      <div className="mt-12 flex flex-col items-center gap-3">
        <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-[rgba(168,85,247,0.15)]">
          <BookOpen size={24} strokeWidth={1.75} className="text-[#A855F7]" />
        </div>
        <p className="text-sm text-[#64748B]">No reading tests available yet</p>
      </div>
    );
  }

  return (
    <div className="mt-6 space-y-3">
      {tests.map((test, idx) => (
        <Link
          key={test.key}
          href={`/dashboard/reading/book${test.bookNumber}-test${test.testNumber}`}
          className="animate-fade-up group flex items-center justify-between rounded-xl border-[0.5px] border-[#2A3150] bg-[#1E2540] p-4 transition-all duration-200 hover:border-[rgba(99,102,241,0.3)]"
          style={{ animationDelay: `${idx * 60}ms` }}
        >
          <div className="flex items-center gap-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-[10px] bg-[rgba(168,85,247,0.15)]">
              <BookOpen size={20} strokeWidth={1.75} className="text-[#A855F7]" />
            </div>
            <div>
              <p className="text-sm font-semibold text-[#F8FAFC]">{test.name}</p>
              <p className="mt-0.5 text-xs text-[#64748B]">
                {test.passages.length} passage{test.passages.length !== 1 ? "s" : ""}
              </p>
            </div>
          </div>
          <ChevronRight
            size={18}
            strokeWidth={1.75}
            className="text-[#64748B] transition-colors group-hover:text-[#818CF8]"
          />
        </Link>
      ))}
    </div>
  );
}

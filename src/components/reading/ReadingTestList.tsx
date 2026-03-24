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
            className="h-24 animate-pulse rounded-xl border border-stone-200 bg-stone-200"
          />
        ))}
      </div>
    );
  }

  if (tests.length === 0) {
    return (
      <div className="mt-12 flex flex-col items-center gap-3">
        <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-amber-100">
          <BookOpen size={24} strokeWidth={1.75} className="text-amber-700" />
        </div>
        <p className="text-sm text-stone-500">No reading tests available yet</p>
      </div>
    );
  }

  return (
    <div className="mt-6 space-y-3">
      {tests.map((test, idx) => (
        <Link
          key={test.key}
          href={`/dashboard/reading/book${test.bookNumber}-test${test.testNumber}`}
          className="panel animate-fade-up group flex items-center justify-between p-4 transition-all duration-200 hover:bg-stone-50"
          style={{ animationDelay: `${idx * 60}ms` }}
        >
          <div className="flex items-center gap-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-[10px] bg-amber-100">
              <BookOpen size={20} strokeWidth={1.75} className="text-amber-700" />
            </div>
            <div>
              <p className="text-sm font-semibold text-stone-800">{test.name}</p>
              <p className="mt-0.5 text-xs text-stone-500">
                {test.passages.length} passage{test.passages.length !== 1 ? "s" : ""}
              </p>
            </div>
          </div>
          <ChevronRight
            size={18}
            strokeWidth={1.75}
            className="text-stone-500 transition-colors group-hover:text-emerald-700"
          />
        </Link>
      ))}
    </div>
  );
}

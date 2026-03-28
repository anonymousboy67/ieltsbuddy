"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  BookOpen,
  Clock,
  Headphones,
  PenLine,
  ChevronRight,
  Trophy,
  AlertCircle,
} from "lucide-react";

interface MockTest {
  bookNumber: number;
  testNumber: number;
  hasReading: boolean;
  hasListening: boolean;
  hasWriting: boolean;
  readingIds: string[];
  listeningIds: string[];
  writingIds: string[];
}

const SECTION_CONFIG = [
  { key: "hasListening", label: "Listening", icon: Headphones, time: "30 min", color: "#22C55E", bg: "rgba(34,197,94,0.12)" },
  { key: "hasReading", label: "Reading", icon: BookOpen, time: "60 min", color: "#A855F7", bg: "rgba(168,85,247,0.12)" },
  { key: "hasWriting", label: "Writing", icon: PenLine, time: "60 min", color: "#F59E0B", bg: "rgba(245,158,11,0.12)" },
];

export default function MockTestListingPage() {
  const [tests, setTests] = useState<MockTest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/mock-test/tests")
      .then((r) => r.json())
      .then((data) => setTests(Array.isArray(data) ? data : []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const getTestKey = (test: MockTest) =>
    `${test.bookNumber}-${test.testNumber}`;

  const getSectionCount = (test: MockTest) =>
    [test.hasListening, test.hasReading, test.hasWriting].filter(Boolean).length;

  const getTotalTime = (test: MockTest) => {
    let mins = 0;
    if (test.hasListening) mins += 30;
    if (test.hasReading) mins += 60;
    if (test.hasWriting) mins += 60;
    if (mins >= 60) return `${Math.floor(mins / 60)}h ${mins % 60 > 0 ? `${mins % 60}m` : ""}`.trim();
    return `${mins}m`;
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="animate-fade-up">
        <div className="flex items-center gap-2 mb-1">
          <Trophy size={18} className="text-[#6366F1]" strokeWidth={1.75} />
          <h1 className="text-xl font-semibold text-[#F8FAFC]">Mock Tests</h1>
        </div>
        <p className="text-sm text-[#64748B]">
          Full IELTS exam simulation with strict timing and auto-submission.
        </p>
      </div>

      {/* Info banner */}
      <div className="animate-fade-up animate-fade-up-1 flex gap-3 rounded-xl border-[0.5px] border-[rgba(99,102,241,0.25)] bg-[rgba(99,102,241,0.06)] p-4">
        <AlertCircle size={16} className="text-[#6366F1] flex-shrink-0 mt-0.5" strokeWidth={1.75} />
        <div className="text-sm text-[#94A3B8]">
          <span className="font-medium text-[#F8FAFC]">Exam conditions apply.</span>{" "}
          Once started, sections are locked in order (Listening → Reading → Writing). The timer cannot be paused. Answers auto-submit when time expires.
        </div>
      </div>

      {/* Section breakdown */}
      <div className="animate-fade-up animate-fade-up-2 grid grid-cols-3 gap-3">
        {SECTION_CONFIG.map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.key} className="rounded-xl border-[0.5px] border-[#2A3150] bg-[#1E2540] p-3 text-center">
              <div
                className="mx-auto mb-2 flex h-9 w-9 items-center justify-center rounded-lg"
                style={{ backgroundColor: s.bg }}
              >
                <Icon size={18} strokeWidth={1.75} style={{ color: s.color }} />
              </div>
              <p className="text-sm font-medium text-[#F8FAFC]">{s.label}</p>
              <div className="mt-1 flex items-center justify-center gap-1">
                <Clock size={11} className="text-[#64748B]" />
                <p className="text-xs text-[#64748B]">{s.time}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Test list */}
      <div className="animate-fade-up animate-fade-up-3 flex flex-col gap-3">
        {loading && (
          <div className="flex flex-col gap-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 animate-pulse rounded-xl bg-[#1E2540]" />
            ))}
          </div>
        )}

        {!loading && tests.length === 0 && (
          <div className="rounded-xl border-[0.5px] border-[#2A3150] bg-[#1E2540] p-8 text-center">
            <p className="text-sm text-[#64748B]">
              No tests available yet. Ask your admin to add test content.
            </p>
          </div>
        )}

        {!loading &&
          tests.map((test) => {
            const sectionCount = getSectionCount(test);
            const isFullTest = sectionCount === 3;
            return (
              <Link
                key={getTestKey(test)}
                href={`/dashboard/mock-test/${getTestKey(test)}`}
                className="group flex items-center justify-between gap-4 rounded-xl border-[0.5px] border-[#2A3150] bg-[#1E2540] p-4 transition-all duration-200 hover:border-[rgba(99,102,241,0.4)] hover:bg-[#242B45]"
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-[rgba(99,102,241,0.12)]">
                    <span className="text-lg font-bold text-[#6366F1]">
                      {test.testNumber}
                    </span>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-[#F8FAFC]">
                        Book {test.bookNumber} · Test {test.testNumber}
                      </p>
                      {isFullTest && (
                        <span className="rounded-full bg-[rgba(34,197,94,0.12)] px-2 py-0.5 text-[10px] font-medium text-[#22C55E]">
                          Full Test
                        </span>
                      )}
                    </div>
                    <div className="mt-1 flex items-center gap-3">
                      {SECTION_CONFIG.map((s) => {
                        const has = test[s.key as keyof MockTest] as boolean;
                        return (
                          <span
                            key={s.key}
                            className={`text-xs ${has ? "text-[#94A3B8]" : "text-[#2A3150] line-through"}`}
                          >
                            {s.label}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="text-sm font-medium text-[#F8FAFC]">{getTotalTime(test)}</p>
                    <p className="text-xs text-[#64748B]">{sectionCount} section{sectionCount !== 1 ? "s" : ""}</p>
                  </div>
                  <ChevronRight
                    size={18}
                    className="text-[#64748B] transition-transform group-hover:translate-x-1"
                    strokeWidth={1.75}
                  />
                </div>
              </Link>
            );
          })}
      </div>
    </div>
  );
}

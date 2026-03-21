"use client";

import { useState, useEffect } from "react";
import AiHeroCard from "@/components/speaking/AiHeroCard";
import SpeakingTestList from "@/components/speaking/SpeakingTestList";

interface SpeakingQuestion {
  _id: string;
  bookNumber: number;
  testNumber: number;
  partNumber: number;
}

export interface SpeakingTestGroup {
  key: string;
  name: string;
  bookNumber: number;
  testNumber: number;
  parts: number;
  firstId: string;
}

export default function SpeakingPage() {
  const [tests, setTests] = useState<SpeakingTestGroup[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchQuestions() {
      try {
        const res = await fetch("/api/content/speaking");
        const questions: SpeakingQuestion[] = await res.json();

        const grouped = new Map<string, SpeakingTestGroup>();
        for (const q of questions) {
          const key = `book${q.bookNumber}-test${q.testNumber}`;
          if (!grouped.has(key)) {
            grouped.set(key, {
              key,
              name: `IELTS Book ${q.bookNumber} Test ${q.testNumber}`,
              bookNumber: q.bookNumber,
              testNumber: q.testNumber,
              parts: 0,
              firstId: q._id,
            });
          }
          grouped.get(key)!.parts++;
        }

        setTests(
          Array.from(grouped.values()).sort(
            (a, b) => a.bookNumber - b.bookNumber || a.testNumber - b.testNumber
          )
        );
      } catch {
        // empty
      } finally {
        setLoading(false);
      }
    }
    fetchQuestions();
  }, []);

  return (
    <>
      <div className="animate-fade-up">
        <h1 className="font-heading text-[28px] font-bold text-[#F8FAFC]">
          Speaking Practice
        </h1>
        <p className="mt-1 text-sm text-[#94A3B8]">
          Real IELTS Speaking Tests
        </p>
      </div>
      <AiHeroCard />
      <SpeakingTestList tests={tests} loading={loading} />
    </>
  );
}

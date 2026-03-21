"use client";

import { useState, useEffect } from "react";
import ReadingTestList from "@/components/reading/ReadingTestList";

interface ReadingPassage {
  _id: string;
  bookNumber: number;
  testNumber: number;
  partNumber: number;
  title: string;
}

export interface ReadingTestGroup {
  key: string;
  name: string;
  bookNumber: number;
  testNumber: number;
  passages: ReadingPassage[];
  firstPassageId: string;
}

export default function ReadingPage() {
  const [tests, setTests] = useState<ReadingTestGroup[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPassages() {
      try {
        const res = await fetch("/api/content/reading");
        const passages: ReadingPassage[] = await res.json();

        const grouped = new Map<string, ReadingTestGroup>();
        for (const p of passages) {
          const key = `book${p.bookNumber}-test${p.testNumber}`;
          if (!grouped.has(key)) {
            grouped.set(key, {
              key,
              name: `IELTS Book ${p.bookNumber} Test ${p.testNumber}`,
              bookNumber: p.bookNumber,
              testNumber: p.testNumber,
              passages: [],
              firstPassageId: p._id,
            });
          }
          grouped.get(key)!.passages.push(p);
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
    fetchPassages();
  }, []);

  return (
    <>
      <div className="animate-fade-up">
        <h1 className="font-heading text-[28px] font-bold text-[#F8FAFC]">
          Reading Practice
        </h1>
        <p className="mt-1 text-sm text-[#94A3B8]">
          Real IELTS Reading Tests
        </p>
      </div>
      <ReadingTestList tests={tests} loading={loading} />
    </>
  );
}

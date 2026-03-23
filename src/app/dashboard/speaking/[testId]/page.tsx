"use client";

import { useParams } from "next/navigation";
import SpeakingTestInterface from "@/components/speaking/SpeakingTestInterface";

export default function SpeakingTestPage() {
  const { testId } = useParams<{ testId: string }>();

  // testId format: "book20-test1"
  const match = testId.match(/book(\d+)-test(\d+)/);
  const bookNumber = match ? Number(match[1]) : 0;
  const testNumber = match ? Number(match[2]) : 0;

  if (!bookNumber || !testNumber) {
    return (
      <div className="flex min-h-[300px] flex-col items-center justify-center gap-4">
        <p className="text-[15px] text-[#94A3B8]">Invalid test ID</p>
      </div>
    );
  }

  return (
    <SpeakingTestInterface
      bookNumber={bookNumber}
      testNumber={testNumber}
    />
  );
}

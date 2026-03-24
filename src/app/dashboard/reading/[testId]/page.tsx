"use client";

import { use } from "react";
import ReadingTestDetail from "@/components/reading/ReadingTestDetail";

interface PageProps {
  params: Promise<{ testId: string }>;
}

export default function ReadingTestPage({ params }: PageProps) {
  const { testId } = use(params);
  const match = testId.match(/^book(\d+)-test(\d+)$/);

  if (!match) {
    return (
      <p className="py-8 text-center text-sm text-[#78716C]">
        Invalid test URL
      </p>
    );
  }

  const bookNumber = Number(match[1]);
  const testNumber = Number(match[2]);

  return <ReadingTestDetail bookNumber={bookNumber} testNumber={testNumber} />;
}

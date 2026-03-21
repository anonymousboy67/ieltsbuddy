"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, BookOpen } from "lucide-react";
import PassageDetail from "./PassageDetail";

const tabs = [
  { id: 0, part: "Part 1", level: "Beginner" },
  { id: 1, part: "Part 2", level: "Intermediate" },
  { id: 2, part: "Part 3", level: "Advanced" },
];

const passages = [
  {
    title: "Stepwells",
    topic: "History/Architecture",
    questions: 13,
    description:
      "Passage 1 usually contains a factual text with questions like finding specific information, True/False/Not Given, or short answers. It is generally the easiest passage.",
    questionTypes: [
      { name: "Sentence Completion", count: 5 },
      { name: "Short Answer", count: 3 },
      { name: "True/False/Not Given", count: 5 },
    ],
    preview:
      "A millennium ago, stepwells were fundamental to life in the driest parts of India. Although many have been neglected, recent restoration has returned them to their former glory. Richard Cox travelled...",
  },
  {
    title: "The Megafires of California",
    topic: "Environment/Science",
    questions: 13,
    description:
      "Passage 2 is typically more complex, often covering scientific or environmental topics. Questions may include matching headings, summary completion, and multiple choice.",
    questionTypes: [
      { name: "Matching Headings", count: 6 },
      { name: "Summary Completion", count: 4 },
      { name: "Multiple Choice", count: 3 },
    ],
    preview:
      "Wildfires have long been a feature of the Californian landscape, but in recent decades they have become more frequent and more destructive. Scientists are now warning that the era of megafires has arrived...",
  },
  {
    title: "Beyond the Blue Horizon",
    topic: "History/Exploration",
    questions: 14,
    description:
      "Passage 3 is the most challenging, often dealing with abstract or analytical content. It tests higher-level reading skills like matching information and evaluating claims.",
    questionTypes: [
      { name: "Matching Information", count: 5 },
      { name: "Yes/No/Not Given", count: 4 },
      { name: "Summary Completion", count: 5 },
    ],
    preview:
      "The first Polynesian voyagers to reach the remote islands of the Pacific Ocean thousands of years ago were among the greatest navigators in human history. How did they find their way across such vast expanses of ocean...",
  },
];

export default function ReadingTestDetail() {
  const [active, setActive] = useState(0);

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
          IELTS Book 10 Test 1
        </h1>
      </div>

      <div className="animate-fade-up animate-fade-up-1 mt-6 flex w-full rounded-xl bg-[#1E2540] p-1">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActive(tab.id)}
            className={`flex-1 cursor-pointer rounded-lg py-2.5 text-center transition-all duration-200 ${
              active === tab.id
                ? "bg-[#6366F1] text-white"
                : "text-[#94A3B8] hover:text-[#F8FAFC]"
            }`}
          >
            <span className="block text-sm font-medium">{tab.part}</span>
            <span className="block text-[11px] opacity-80">{tab.level}</span>
          </button>
        ))}
      </div>

      <div className="mt-6">
        <PassageDetail data={passages[active]} />
      </div>

      <div className="mt-8 pb-4">
        <button className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#6366F1] py-3.5 text-[15px] font-medium text-white transition-colors duration-200 hover:bg-[#818CF8]">
          <BookOpen size={18} strokeWidth={1.75} />
          Start Test
        </button>
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, List, HelpCircle, Headphones } from "lucide-react";
import TestStructure from "./TestStructure";

export default function ListeningTestDetail() {
  const [audioControls, setAudioControls] = useState(false);

  return (
    <div>
      <div className="animate-fade-up flex items-center gap-3">
        <Link
          href="/dashboard/listening"
          className="flex h-10 w-10 items-center justify-center rounded-full border-[0.5px] border-[#2A3150] bg-[#1E2540] transition-all duration-200 hover:border-[rgba(99,102,241,0.3)]"
        >
          <ArrowLeft size={20} strokeWidth={1.75} className="text-[#94A3B8]" />
        </Link>
        <h1 className="text-base font-medium text-[#F8FAFC]">
          IELTS Book 10 Test 1
        </h1>
      </div>

      <div className="animate-fade-up animate-fade-up-1 mt-6 rounded-xl border-[0.5px] border-[#2A3150] bg-[#1E2540] p-5">
        <h2 className="font-heading text-xl font-bold text-[#F8FAFC]">
          IELTS Book 10 Test 1
        </h2>
        <div className="mt-2 flex items-center gap-2 text-sm">
          <span className="flex items-center gap-1.5 text-[#22C55E]">
            <List size={14} strokeWidth={1.75} />
            4 Sections
          </span>
          <span className="text-[#2A3150]">-</span>
          <span className="flex items-center gap-1.5 text-[#64748B]">
            <HelpCircle size={14} strokeWidth={1.75} />
            40 Questions
          </span>
        </div>
        <p className="mt-3 text-sm text-[#94A3B8]">
          The Listening test takes approximately 30-40 minutes. You will hear
          four recordings of native English speakers and then write your answers
          to a series of questions.
        </p>
      </div>

      <div className="animate-fade-up animate-fade-up-2 mt-4 flex items-center justify-between rounded-xl border-[0.5px] border-[#2A3150] bg-[#1E2540] p-4">
        <div className="min-w-0">
          <p className="text-[15px] font-medium text-[#F8FAFC]">
            Enable Audio Controls
          </p>
          <p className="mt-0.5 text-[13px] text-[#64748B]">
            Allow pausing, rewinding, and fast-forwarding.
          </p>
        </div>
        <button
          onClick={() => setAudioControls(!audioControls)}
          className={`relative ml-4 h-7 w-12 flex-shrink-0 cursor-pointer rounded-full transition-colors duration-200 ${
            audioControls ? "bg-[#6366F1]" : "bg-[#2A3150]"
          }`}
          role="switch"
          aria-checked={audioControls}
        >
          <span
            className={`absolute top-1 left-1 h-5 w-5 rounded-full bg-white transition-transform duration-200 ${
              audioControls ? "translate-x-5" : "translate-x-0"
            }`}
          />
        </button>
      </div>

      <TestStructure />

      <button className="mt-6 flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#6366F1] py-3.5 text-[15px] font-medium text-white transition-colors duration-200 hover:bg-[#818CF8]">
        <Headphones size={18} strokeWidth={1.75} />
        Start Test
      </button>
    </div>
  );
}

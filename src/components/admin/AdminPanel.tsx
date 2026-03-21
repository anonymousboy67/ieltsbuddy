"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import WritingTab from "./WritingTab";
import ReadingTab from "./ReadingTab";
import SpeakingTab from "./SpeakingTab";

const tabs = ["Writing Tasks", "Reading Passages", "Speaking Questions"];

interface Toast {
  message: string;
  type: "success" | "error";
}

export default function AdminPanel() {
  const [active, setActive] = useState(0);
  const [toast, setToast] = useState<Toast | null>(null);

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  return (
    <div className="min-h-dvh bg-[#0B0F1A] px-4 py-6 md:px-6">
      <div className="mx-auto max-w-[900px]">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard"
            className="flex h-10 w-10 items-center justify-center rounded-full border-[0.5px] border-[#2A3150] bg-[#1E2540] transition-all duration-200 hover:border-[rgba(99,102,241,0.3)]"
          >
            <ArrowLeft size={20} strokeWidth={1.75} className="text-[#94A3B8]" />
          </Link>
          <h1 className="font-heading text-2xl font-bold text-[#F8FAFC]">
            Admin Panel - IELTSBuddy
          </h1>
        </div>

        <div className="mt-6 flex rounded-xl bg-[#1E2540] p-1">
          {tabs.map((tab, i) => (
            <button
              key={tab}
              onClick={() => setActive(i)}
              className={`flex-1 cursor-pointer rounded-lg py-2.5 text-center text-sm font-medium transition-all duration-200 ${
                active === i
                  ? "bg-[#6366F1] text-white"
                  : "text-[#94A3B8] hover:text-[#F8FAFC]"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="mt-6">
          {active === 0 && <WritingTab onToast={showToast} />}
          {active === 1 && <ReadingTab onToast={showToast} />}
          {active === 2 && <SpeakingTab onToast={showToast} />}
        </div>
      </div>

      {toast && (
        <div
          className={`fixed bottom-6 left-1/2 -translate-x-1/2 rounded-lg px-5 py-3 text-sm font-medium text-white shadow-lg transition-all ${
            toast.type === "success" ? "bg-[#22C55E]" : "bg-[#EF4444]"
          }`}
        >
          {toast.message}
        </div>
      )}
    </div>
  );
}

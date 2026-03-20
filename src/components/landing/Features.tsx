"use client";

import { Mic, PenLine, BookOpen, Headphones } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useScrollReveal } from "@/lib/useScrollReveal";

interface Feature {
  title: string;
  icon: LucideIcon;
  color: string;
  bg: string;
  desc: string;
  bullets: string[];
}

const features: Feature[] = [
  {
    title: "AI Speaking Practice",
    icon: Mic,
    color: "#0EA5E9",
    bg: "rgba(14,165,233,0.15)",
    desc: "Practice with an AI examiner that evaluates you in real time.",
    bullets: [
      "Practice with AI examiner",
      "Get instant band scores",
      "Fluency and pronunciation feedback",
    ],
  },
  {
    title: "AI Writing Correction",
    icon: PenLine,
    color: "#F97316",
    bg: "rgba(249,115,22,0.15)",
    desc: "Submit essays and get detailed AI-powered feedback instantly.",
    bullets: [
      "Submit Task 1 & Task 2 essays",
      "Detailed band score feedback",
      "Grammar and coherence tips",
    ],
  },
  {
    title: "Reading Practice",
    icon: BookOpen,
    color: "#A855F7",
    bg: "rgba(168,85,247,0.15)",
    desc: "Practice with real Cambridge IELTS reading passages.",
    bullets: [
      "Real Cambridge passages",
      "Timed practice mode",
      "Track your accuracy",
    ],
  },
  {
    title: "Listening Tests",
    icon: Headphones,
    color: "#22C55E",
    bg: "rgba(34,197,94,0.15)",
    desc: "Full listening tests with all 4 sections from real exams.",
    bullets: [
      "Real IELTS audio tests",
      "All 4 sections covered",
      "Progress tracking",
    ],
  },
];

export default function Features() {
  const ref = useScrollReveal<HTMLElement>();

  return (
    <section
      id="features"
      ref={ref}
      className="scroll-reveal mx-auto max-w-[1200px] px-4 py-20 md:px-6"
    >
      <div className="text-center">
        <h2 className="font-heading text-[28px] font-bold text-[#F8FAFC] md:text-[32px]">
          Everything you need to ace IELTS
        </h2>
        <p className="mt-3 text-base text-[#94A3B8]">
          Practice all four skills with AI-powered feedback
        </p>
      </div>

      <div className="mt-12 grid gap-4 sm:grid-cols-2">
        {features.map((f) => {
          const Icon = f.icon;
          return (
            <div
              key={f.title}
              className="rounded-2xl border-[0.5px] border-[#2A3150] bg-[#12172B] p-7 transition-all duration-200 hover:-translate-y-0.5 hover:border-[rgba(99,102,241,0.3)]"
            >
              <div
                className="flex h-12 w-12 items-center justify-center rounded-xl"
                style={{ backgroundColor: f.bg }}
              >
                <Icon size={24} strokeWidth={1.75} style={{ color: f.color }} />
              </div>
              <h3 className="mt-5 text-lg font-semibold text-[#F8FAFC]">
                {f.title}
              </h3>
              <p className="mt-2 text-sm text-[#94A3B8]">{f.desc}</p>
              <ul className="mt-4 flex flex-col gap-1.5">
                {f.bullets.map((b) => (
                  <li key={b} className="text-[13px] text-[#64748B]">
                    {b}
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
    </section>
  );
}

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
    color: "#0F766E",
    bg: "#CCFBF1",
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
    color: "#C2410C",
    bg: "#FFEDD5",
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
    color: "#B45309",
    bg: "#FEF3C7",
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
    color: "#047857",
    bg: "#D1FAE5",
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
        <h2 className="font-heading text-[28px] font-bold text-stone-800 md:text-[32px]">
          Everything you need to ace IELTS
        </h2>
        <p className="mt-3 text-base text-stone-600">
          Practice all four skills with AI-powered feedback
        </p>
      </div>

      <div className="mt-12 grid gap-4 sm:grid-cols-2">
        {features.map((f) => {
          const Icon = f.icon;
          return (
            <div
              key={f.title}
              className="rounded-2xl border border-stone-200 bg-[#FDF8F2] p-7 shadow-[0_2px_10px_rgba(0,0,0,0.04)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-stone-50"
            >
              <div
                className="flex h-12 w-12 items-center justify-center rounded-xl"
                style={{ backgroundColor: f.bg }}
              >
                <Icon size={24} strokeWidth={1.75} style={{ color: f.color }} />
              </div>
              <h3 className="mt-5 font-heading text-lg font-semibold text-stone-800">
                {f.title}
              </h3>
              <p className="mt-2 text-sm text-stone-600">{f.desc}</p>
              <ul className="mt-4 flex flex-col gap-1.5">
                {f.bullets.map((b) => (
                  <li key={b} className="text-[13px] text-stone-500">
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

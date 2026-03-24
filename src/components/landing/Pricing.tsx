"use client";

import Link from "next/link";
import { Check } from "lucide-react";
import { useScrollReveal } from "@/lib/useScrollReveal";

const free = [
  "1 free test per skill",
  "AI speaking practice (limited)",
  "Basic progress tracking",
  "Community access",
];

const pro = [
  "Everything in Free",
  "Unlock all 300+ tests",
  "Unlimited AI speaking & writing",
  "Personalized study plan",
  "Priority support",
];

export default function Pricing() {
  const ref = useScrollReveal<HTMLElement>();

  return (
    <section
      id="pricing"
      ref={ref}
      className="scroll-reveal mx-auto max-w-[800px] px-4 py-20 md:px-6"
    >
      <div className="text-center">
        <h2 className="font-heading text-[28px] font-bold text-[#F8FAFC] md:text-[32px]">
          Simple, affordable pricing
        </h2>
        <p className="mt-3 text-base text-[#94A3B8]">
          Start free, upgrade when you&apos;re ready
        </p>
      </div>

      <div className="mt-12 grid gap-6 sm:grid-cols-2">
        <div className="rounded-2xl border-[0.5px] border-[#2A3150] bg-[#1E2540] p-8">
          <h3 className="font-heading text-xl font-bold text-[#F8FAFC]">Free</h3>
          <p className="mt-2 text-3xl font-bold text-[#F8FAFC]">
            NRs 0
          </p>
          <p className="mt-1 text-sm text-[#64748B]">Perfect to get started</p>
          <ul className="mt-6 flex flex-col gap-3">
            {free.map((f) => (
              <li key={f} className="flex items-center gap-2 text-sm text-[#94A3B8]">
                <Check size={16} strokeWidth={2} className="flex-shrink-0 text-[#22C55E]" />
                {f}
              </li>
            ))}
          </ul>
          <Link
            href="/api/auth/signin?callbackUrl=/dashboard"
            className="mt-8 block w-full rounded-xl border-[0.5px] border-[#2A3150] py-3 text-center text-[15px] font-medium text-[#94A3B8] transition-all duration-200 hover:border-[#6366F1] hover:text-white"
          >
            Get Started Free
          </Link>
        </div>

        <div className="relative rounded-2xl border-2 border-[#6366F1] bg-[#1E2540] p-8">
          <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full bg-[#6366F1] px-4 py-1 text-xs font-medium text-white">
            Most Popular
          </span>
          <h3 className="font-heading text-xl font-bold text-[#F8FAFC]">Pro</h3>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-[#F8FAFC]">NRs 499</span>
            <span className="text-sm text-[#64748B] line-through">NRs 999</span>
            <span className="text-sm text-[#64748B]">/mo</span>
          </div>
          <p className="mt-1 text-sm text-[#64748B]">
            Everything you need to succeed
          </p>
          <ul className="mt-6 flex flex-col gap-3">
            {pro.map((p) => (
              <li key={p} className="flex items-center gap-2 text-sm text-[#94A3B8]">
                <Check size={16} strokeWidth={2} className="flex-shrink-0 text-[#22C55E]" />
                {p}
              </li>
            ))}
          </ul>
          <Link
            href="/api/auth/signin?callbackUrl=/dashboard"
            className="mt-8 block w-full rounded-xl bg-[#6366F1] py-3 text-center text-[15px] font-medium text-white transition-colors duration-200 hover:bg-[#818CF8]"
          >
            Start Pro Plan
          </Link>
        </div>
      </div>
    </section>
  );
}

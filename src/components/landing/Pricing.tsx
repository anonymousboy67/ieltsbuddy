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
        <h2 className="font-heading text-[28px] font-bold text-stone-800 md:text-[32px]">
          Simple, affordable pricing
        </h2>
        <p className="mt-3 text-base text-stone-600">
          Start free, upgrade when you&apos;re ready
        </p>
      </div>

      <div className="mt-12 grid gap-6 sm:grid-cols-2">
        <div className="rounded-2xl border border-stone-200 bg-[#FDF8F2] p-8 shadow-[0_2px_10px_rgba(0,0,0,0.04)]">
          <h3 className="font-heading text-xl font-bold text-stone-800">Free</h3>
          <p className="mt-2 text-3xl font-bold text-stone-800">
            NRs 0
          </p>
          <p className="mt-1 text-sm text-stone-500">Perfect to get started</p>
          <ul className="mt-6 flex flex-col gap-3">
            {free.map((f) => (
              <li key={f} className="flex items-center gap-2 text-sm text-stone-600">
                <Check size={16} strokeWidth={2} className="flex-shrink-0 text-emerald-700" />
                {f}
              </li>
            ))}
          </ul>
          <Link
            href="/onboarding"
            className="mt-8 block w-full rounded-xl bg-stone-100 py-3 text-center text-[15px] font-medium text-stone-700 transition-all duration-200 hover:bg-stone-200"
          >
            Get Started Free
          </Link>
        </div>

        <div className="relative rounded-2xl border-2 border-emerald-700 bg-[#FDF8F2] p-8 shadow-[0_2px_10px_rgba(0,0,0,0.04)]">
          <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full bg-emerald-700 px-4 py-1 text-xs font-medium text-white">
            Most Popular
          </span>
          <h3 className="font-heading text-xl font-bold text-stone-800">Pro</h3>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-stone-800">NRs 499</span>
            <span className="text-sm text-stone-500 line-through">NRs 999</span>
            <span className="text-sm text-stone-500">/mo</span>
          </div>
          <p className="mt-1 text-sm text-stone-500">
            Everything you need to succeed
          </p>
          <ul className="mt-6 flex flex-col gap-3">
            {pro.map((p) => (
              <li key={p} className="flex items-center gap-2 text-sm text-stone-600">
                <Check size={16} strokeWidth={2} className="flex-shrink-0 text-emerald-700" />
                {p}
              </li>
            ))}
          </ul>
          <Link
            href="/onboarding"
            className="mt-8 block w-full rounded-xl bg-emerald-700 py-3 text-center text-[15px] font-semibold text-white transition-colors duration-200 hover:bg-teal-700"
          >
            Start Pro Plan
          </Link>
        </div>
      </div>
    </section>
  );
}

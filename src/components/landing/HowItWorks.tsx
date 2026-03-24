"use client";

import { useScrollReveal } from "@/lib/useScrollReveal";

const steps = [
  {
    num: "01",
    title: "Set your goal",
    desc: "Tell us your target band score and test date",
  },
  {
    num: "02",
    title: "Practice daily",
    desc: "AI creates a personalized study plan across all 4 skills",
  },
  {
    num: "03",
    title: "Track progress",
    desc: "Monitor your improvement and adjust your plan",
  },
];

export default function HowItWorks() {
  const ref = useScrollReveal<HTMLElement>();

  return (
    <section
      id="how-it-works"
      ref={ref}
      className="scroll-reveal bg-[#F8F5F1] py-20"
    >
      <div className="mx-auto max-w-[1200px] px-4 md:px-6">
        <div className="text-center">
          <h2 className="font-heading text-[28px] font-bold text-stone-800 md:text-[32px]">
            How it works
          </h2>
          <p className="mt-3 text-base text-stone-600">
            Get started in 3 simple steps
          </p>
        </div>

        <div className="relative mt-14 grid gap-10 md:grid-cols-3 md:gap-8">
          <div className="pointer-events-none absolute top-8 right-[33%] left-[33%] hidden h-px border-t border-dashed border-stone-300 md:block" />

          {steps.map((s) => (
            <div key={s.num} className="relative text-center">
              <span className="font-heading text-5xl font-bold text-emerald-700">
                {s.num}
              </span>
              <h3 className="mt-4 font-heading text-lg font-semibold text-stone-800">
                {s.title}
              </h3>
              <p className="mt-2 text-sm text-stone-600">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

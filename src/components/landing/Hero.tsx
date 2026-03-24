import Link from "next/link";
import { Sparkles, ArrowRight, Star } from "lucide-react";

export default function Hero() {
  return (
    <section className="relative flex min-h-dvh items-center justify-center overflow-hidden px-4 pt-16">
      <div className="pointer-events-none absolute top-1/2 left-1/2 h-[640px] w-[640px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-amber-100 opacity-70 blur-[120px]" />
      <div className="pointer-events-none absolute -top-20 -right-20 h-[280px] w-[280px] rounded-full bg-emerald-100 opacity-60 blur-[90px]" />

      <div className="relative z-10 mx-auto max-w-[720px] text-center">
        <div className="animate-fade-up inline-flex items-center gap-2 rounded-full border border-stone-200 bg-[#FDF8F2] px-4 py-1.5 shadow-[0_2px_10px_rgba(0,0,0,0.04)]">
          <Sparkles size={14} strokeWidth={1.75} className="text-amber-700" />
          <span className="text-[13px] font-medium text-stone-700">
            AI-Powered IELTS Preparation
          </span>
        </div>

        <h1 className="animate-fade-up animate-fade-up-1 mt-6 font-heading text-[34px] font-bold leading-tight text-stone-800 md:text-5xl md:leading-tight">
          Achieve Your Dream IELTS Score
        </h1>

        <p className="animate-fade-up animate-fade-up-2 mx-auto mt-5 max-w-[560px] text-base text-stone-600 md:text-lg">
          The smartest way for Nepali students to prepare for IELTS. AI-powered
          practice, real Cambridge questions, and personalized study plans.
        </p>

        <div className="animate-fade-up animate-fade-up-3 mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <Link
            href="/onboarding"
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-700 px-8 py-3.5 text-[15px] font-semibold text-white transition-colors duration-200 hover:bg-teal-700"
          >
            Start Free Practice
            <ArrowRight size={18} strokeWidth={1.75} />
          </Link>
          <a
            href="#how-it-works"
            className="inline-flex items-center rounded-xl border border-stone-200 bg-[#FDF8F2] px-8 py-3.5 text-[15px] font-medium text-stone-700 transition-all duration-200 hover:bg-stone-100"
          >
            See How It Works
          </a>
        </div>

        <div className="animate-fade-up animate-fade-up-4 mt-10 flex items-center justify-center gap-6 text-sm text-stone-500">
          <span className="flex items-center gap-1.5">
            <Star size={14} strokeWidth={1.75} className="text-amber-600" />
            4.8 Rating
          </span>
          <span className="h-4 w-px bg-stone-300" />
          <span>300+ Mock Tests</span>
          <span className="h-4 w-px bg-stone-300" />
          <span className="hidden sm:inline">+1.5 Avg. Band Increase</span>
          <span className="sm:hidden">+1.5 Band Avg.</span>
        </div>
      </div>
    </section>
  );
}

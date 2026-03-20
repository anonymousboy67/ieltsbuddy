import Link from "next/link";
import { Sparkles, ArrowRight, Star } from "lucide-react";

export default function Hero() {
  return (
    <section className="relative flex min-h-dvh items-center justify-center overflow-hidden px-4 pt-16">
      <div className="pointer-events-none absolute top-1/2 left-1/2 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#6366F1] opacity-[0.08] blur-[120px]" />

      <div className="relative z-10 mx-auto max-w-[720px] text-center">
        <div className="animate-fade-up inline-flex items-center gap-2 rounded-full border-[0.5px] border-[rgba(99,102,241,0.3)] bg-[rgba(99,102,241,0.1)] px-4 py-1.5">
          <Sparkles size={14} strokeWidth={1.75} className="text-[#818CF8]" />
          <span className="text-[13px] font-medium text-[#818CF8]">
            AI-Powered IELTS Preparation
          </span>
        </div>

        <h1 className="animate-fade-up animate-fade-up-1 mt-6 font-heading text-[32px] font-bold leading-tight text-[#F8FAFC] md:text-5xl md:leading-tight">
          Achieve Your Dream IELTS Score
        </h1>

        <p className="animate-fade-up animate-fade-up-2 mx-auto mt-5 max-w-[560px] text-base text-[#94A3B8] md:text-lg">
          The smartest way for Nepali students to prepare for IELTS. AI-powered
          practice, real Cambridge questions, and personalized study plans.
        </p>

        <div className="animate-fade-up animate-fade-up-3 mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <Link
            href="/onboarding"
            className="inline-flex items-center gap-2 rounded-xl bg-[#6366F1] px-8 py-3.5 text-[15px] font-medium text-white transition-colors duration-200 hover:bg-[#818CF8]"
          >
            Start Free Practice
            <ArrowRight size={18} strokeWidth={1.75} />
          </Link>
          <a
            href="#how-it-works"
            className="inline-flex items-center rounded-xl border-[0.5px] border-[#2A3150] px-8 py-3.5 text-[15px] font-medium text-[#94A3B8] transition-all duration-200 hover:border-[#6366F1] hover:text-white"
          >
            See How It Works
          </a>
        </div>

        <div className="animate-fade-up animate-fade-up-4 mt-10 flex items-center justify-center gap-6 text-sm text-[#64748B]">
          <span className="flex items-center gap-1.5">
            <Star size={14} strokeWidth={1.75} className="text-[#F59E0B]" />
            4.8 Rating
          </span>
          <span className="h-4 w-px bg-[#2A3150]" />
          <span>300+ Mock Tests</span>
          <span className="h-4 w-px bg-[#2A3150]" />
          <span className="hidden sm:inline">+1.5 Avg. Band Increase</span>
          <span className="sm:hidden">+1.5 Band Avg.</span>
        </div>
      </div>
    </section>
  );
}

import Link from "next/link";
import { ArrowRight } from "lucide-react";

export default function Home() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center px-4">
      <div className="flex items-center gap-2">
        <span className="h-3 w-3 rounded-full bg-[#6366F1]" />
        <h1 className="font-heading text-4xl font-bold text-[#F8FAFC]">
          IELTSBuddy
        </h1>
      </div>
      <p className="mt-3 text-center text-lg text-[#94A3B8]">
        IELTS Preparation for Nepali Students
      </p>
      <Link
        href="/onboarding"
        className="mt-8 inline-flex items-center gap-2 rounded-xl bg-[#6366F1] px-8 py-3.5 text-[15px] font-medium text-white transition-colors duration-200 hover:bg-[#818CF8]"
      >
        Get Started
        <ArrowRight size={18} strokeWidth={1.75} />
      </Link>
    </div>
  );
}

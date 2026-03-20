import { Sprout, BookOpen, Target } from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface EnglishLevelProps {
  value: string;
  onChange: (v: string) => void;
}

interface Option {
  id: string;
  label: string;
  desc: string;
  icon: LucideIcon;
}

const options: Option[] = [
  {
    id: "beginner",
    label: "Beginner",
    desc: "New to IELTS, band 4-5",
    icon: Sprout,
  },
  {
    id: "intermediate",
    label: "Intermediate",
    desc: "Some experience, band 5-6.5",
    icon: BookOpen,
  },
  {
    id: "advanced",
    label: "Advanced",
    desc: "Strong base, aiming for 7+",
    icon: Target,
  },
];

export default function EnglishLevel({ value, onChange }: EnglishLevelProps) {
  return (
    <div>
      <h2 className="font-heading text-2xl font-bold text-[#F8FAFC]">
        What&apos;s your current English level?
      </h2>
      <p className="mt-2 text-sm text-[#94A3B8]">
        Be honest - it helps us personalize your plan.
      </p>
      <div className="mt-6 flex flex-col gap-3">
        {options.map((opt) => {
          const Icon = opt.icon;
          const selected = value === opt.id;
          return (
            <button
              key={opt.id}
              onClick={() => onChange(opt.id)}
              className={`flex cursor-pointer items-center gap-4 rounded-xl border-[0.5px] p-4 text-left transition-all duration-200 hover:-translate-y-0.5 ${
                selected
                  ? "border-[#6366F1] bg-[rgba(99,102,241,0.1)]"
                  : "border-[#2A3150] bg-[#1E2540] hover:border-[rgba(99,102,241,0.3)]"
              }`}
            >
              <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-[rgba(99,102,241,0.15)]">
                <Icon size={24} strokeWidth={1.75} className="text-[#6366F1]" />
              </div>
              <div className="min-w-0">
                <p className="text-[15px] font-medium text-[#F8FAFC]">{opt.label}</p>
                <p className="mt-0.5 text-sm text-[#64748B]">{opt.desc}</p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

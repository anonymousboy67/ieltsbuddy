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
      <h2 className="font-heading text-2xl font-bold text-[#292524]">
        What&apos;s your current English level?
      </h2>
      <p className="mt-2 text-sm text-[#57534E]">
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
                  ? "border-[#047857] bg-[rgba(4,120,87,0.10)]"
                  : "border-[#E7E5E4] bg-[#FDF8F2] hover:border-[rgba(4,120,87,0.28)]"
              }`}
            >
              <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-[rgba(4,120,87,0.15)]">
                <Icon size={24} strokeWidth={1.75} className="text-[#047857]" />
              </div>
              <div className="min-w-0">
                <p className="text-[15px] font-medium text-[#292524]">{opt.label}</p>
                <p className="mt-0.5 text-sm text-[#78716C]">{opt.desc}</p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

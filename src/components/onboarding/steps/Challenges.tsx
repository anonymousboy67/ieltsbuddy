import { Mic, BookOpen, PenLine, Headphones, Clock, Type, Check } from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface ChallengesProps {
  value: string[];
  onChange: (v: string[]) => void;
}

interface Option {
  id: string;
  label: string;
  icon: LucideIcon;
}

const options: Option[] = [
  { id: "speaking", label: "Speaking confidence", icon: Mic },
  { id: "reading", label: "Reading speed", icon: BookOpen },
  { id: "writing", label: "Writing structure", icon: PenLine },
  { id: "listening", label: "Listening comprehension", icon: Headphones },
  { id: "time", label: "Time management", icon: Clock },
  { id: "vocabulary", label: "Vocabulary", icon: Type },
];

export default function Challenges({ value, onChange }: ChallengesProps) {
  const toggle = (id: string) => {
    onChange(
      value.includes(id) ? value.filter((v) => v !== id) : [...value, id]
    );
  };

  return (
    <div>
      <h2 className="font-heading text-2xl font-bold text-[#F8FAFC]">
        What&apos;s stopping you from reaching your goal?
      </h2>
      <p className="mt-2 text-sm text-[#94A3B8]">Select all that apply.</p>
      <div className="mt-6 flex flex-col gap-3">
        {options.map((opt) => {
          const Icon = opt.icon;
          const selected = value.includes(opt.id);
          return (
            <button
              key={opt.id}
              onClick={() => toggle(opt.id)}
              className={`flex cursor-pointer items-center gap-4 rounded-xl border-[0.5px] p-4 text-left transition-all duration-200 hover:-translate-y-0.5 ${
                selected
                  ? "border-[#6366F1] bg-[rgba(99,102,241,0.1)]"
                  : "border-[#2A3150] bg-[#1E2540] hover:border-[rgba(99,102,241,0.3)]"
              }`}
            >
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-[10px] bg-[rgba(99,102,241,0.15)]">
                <Icon size={20} strokeWidth={1.75} className="text-[#6366F1]" />
              </div>
              <span className="flex-1 text-[15px] font-medium text-[#F8FAFC]">
                {opt.label}
              </span>
              {selected && (
                <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-[#6366F1]">
                  <Check size={14} strokeWidth={2.5} className="text-white" />
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

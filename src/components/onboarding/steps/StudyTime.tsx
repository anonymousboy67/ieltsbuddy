import { Zap, Coffee, BookOpen, Rocket } from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface StudyTimeProps {
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
  { id: "15min", label: "15 minutes", desc: "Quick daily sessions", icon: Zap },
  { id: "30min", label: "30 minutes", desc: "Steady progress", icon: Coffee },
  { id: "1hr", label: "1 hour", desc: "Recommended pace", icon: BookOpen },
  { id: "2hr", label: "2+ hours", desc: "Intensive preparation", icon: Rocket },
];

export default function StudyTime({ value, onChange }: StudyTimeProps) {
  return (
    <div>
      <h2 className="font-heading text-2xl font-bold text-[#292524]">
        How much time can you study daily?
      </h2>
      <p className="mt-2 text-sm text-[#57534E]">
        Even 15 minutes a day makes a difference.
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

import { Headphones, BookOpen, PenLine, Mic } from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface SkillStat {
  label: string;
  value: number;
  icon: LucideIcon;
  color: string;
  bg: string;
}

const stats: SkillStat[] = [
  {
    label: "Listening",
    value: 0,
    icon: Headphones,
    color: "#22C55E",
    bg: "rgba(34,197,94,0.15)",
  },
  {
    label: "Reading",
    value: 0,
    icon: BookOpen,
    color: "#A855F7",
    bg: "rgba(168,85,247,0.15)",
  },
  {
    label: "Writing",
    value: 0,
    icon: PenLine,
    color: "#F97316",
    bg: "rgba(249,115,22,0.15)",
  },
  {
    label: "Speaking",
    value: 0,
    icon: Mic,
    color: "#0EA5E9",
    bg: "rgba(14,165,233,0.15)",
  },
];

export default function SkillStats() {
  return (
    <div className="animate-fade-up animate-fade-up-2 mt-5 grid grid-cols-2 gap-4 rounded-xl border-[0.5px] border-[#2A3150] bg-[#1E2540] p-4 sm:grid-cols-4 sm:gap-0">
      {stats.map((stat, i) => {
        const Icon = stat.icon;
        return (
          <div
            key={stat.label}
            className={`flex flex-col items-center gap-1.5 ${
              i < stats.length - 1
                ? "sm:border-r-[0.5px] sm:border-[rgba(255,255,255,0.06)]"
                : ""
            }`}
          >
            <div
              className="flex h-8 w-8 items-center justify-center rounded-lg"
              style={{ backgroundColor: stat.bg }}
            >
              <Icon size={16} strokeWidth={1.75} style={{ color: stat.color }} />
            </div>
            <span className="text-xl font-bold text-[#F8FAFC]">{stat.value}</span>
            <span className="text-xs text-[#64748B]">{stat.label}</span>
          </div>
        );
      })}
    </div>
  );
}

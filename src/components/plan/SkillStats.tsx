import { Headphones, BookOpen, PenLine, Mic } from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface SkillStat {
  label: string;
  value: number;
  icon: LucideIcon;
  color: string;
  bg: string;
}

interface SkillStatsProps {
  listening: number;
  reading: number;
  writing: number;
  speaking: number;
}

export default function SkillStats({ listening, reading, writing, speaking }: SkillStatsProps) {
  const stats: SkillStat[] = [
    {
      label: "Listening",
      value: listening,
      icon: Headphones,
      color: "#047857",
      bg: "#D1FAE5",
    },
    {
      label: "Reading",
      value: reading,
      icon: BookOpen,
      color: "#B45309",
      bg: "#FEF3C7",
    },
    {
      label: "Writing",
      value: writing,
      icon: PenLine,
      color: "#C2410C",
      bg: "#FFEDD5",
    },
    {
      label: "Speaking",
      value: speaking,
      icon: Mic,
      color: "#0F766E",
      bg: "#CCFBF1",
    },
  ];

  return (
    <div className="panel animate-fade-up animate-fade-up-2 mt-5 grid grid-cols-2 gap-4 p-4 sm:grid-cols-4 sm:gap-0">
      {stats.map((stat, i) => {
        const Icon = stat.icon;
        return (
          <div
            key={stat.label}
            className={`flex flex-col items-center gap-1.5 ${
              i < stats.length - 1
                ? "sm:border-r sm:border-stone-100"
                : ""
            }`}
          >
            <div
              className="flex h-8 w-8 items-center justify-center rounded-lg"
              style={{ backgroundColor: stat.bg }}
            >
              <Icon size={16} strokeWidth={1.75} style={{ color: stat.color }} />
            </div>
            <span className="text-xl font-bold text-stone-800">{stat.value}</span>
            <span className="text-xs text-stone-500">{stat.label}</span>
          </div>
        );
      })}
    </div>
  );
}

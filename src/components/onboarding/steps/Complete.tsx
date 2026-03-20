import { Check, Star, Mic, Headphones, BookOpen, PenLine } from "lucide-react";

interface CompleteProps {
  band: string;
}

const skills = [
  { label: "Speaking Daily", icon: Mic, color: "#0EA5E9", bg: "rgba(14,165,233,0.15)" },
  { label: "Listening Daily", icon: Headphones, color: "#22C55E", bg: "rgba(34,197,94,0.15)" },
  { label: "Reading Daily", icon: BookOpen, color: "#A855F7", bg: "rgba(168,85,247,0.15)" },
  { label: "Writing Daily", icon: PenLine, color: "#F97316", bg: "rgba(249,115,22,0.15)" },
];

export default function Complete({ band }: CompleteProps) {
  return (
    <div className="flex flex-col items-center text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#6366F1]">
        <Check size={32} strokeWidth={2} className="text-white" />
      </div>
      <h2 className="mt-6 font-heading text-2xl font-bold text-[#F8FAFC]">
        Congratulations, your plan is ready!
      </h2>

      <p className="mt-6 text-xs text-[#64748B]">Your study plan</p>
      <div className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-[rgba(99,102,241,0.15)] px-4 py-1.5">
        <Star size={14} strokeWidth={1.75} className="text-[#6366F1]" />
        <span className="text-sm font-medium text-[#6366F1]">
          Target: Band {band || "7.5"}
        </span>
      </div>

      <div className="mt-6 grid w-full grid-cols-2 gap-3">
        {skills.map((skill) => {
          const Icon = skill.icon;
          return (
            <div
              key={skill.label}
              className="flex flex-col items-center gap-2 rounded-xl border-[0.5px] border-[#2A3150] bg-[#1E2540] p-4"
            >
              <div
                className="flex h-10 w-10 items-center justify-center rounded-[10px]"
                style={{ backgroundColor: skill.bg }}
              >
                <Icon size={20} strokeWidth={1.75} style={{ color: skill.color }} />
              </div>
              <span className="text-sm font-medium text-[#F8FAFC]">
                {skill.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

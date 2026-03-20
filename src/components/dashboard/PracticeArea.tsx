import { Mic, PenLine, BookOpen, Headphones } from "lucide-react";

const skills = [
  {
    name: "Speaking",
    icon: Mic,
    color: "#0EA5E9",
    bg: "rgba(14,165,233,0.15)",
  },
  {
    name: "Writing",
    icon: PenLine,
    color: "#F97316",
    bg: "rgba(249,115,22,0.15)",
  },
  {
    name: "Reading",
    icon: BookOpen,
    color: "#A855F7",
    bg: "rgba(168,85,247,0.15)",
  },
  {
    name: "Listening",
    icon: Headphones,
    color: "#22C55E",
    bg: "rgba(34,197,94,0.15)",
  },
];

const staggerClass = [
  "animate-fade-up-2",
  "animate-fade-up-3",
  "animate-fade-up-4",
  "animate-fade-up-5",
];

export default function PracticeArea() {
  return (
    <section className="mt-8">
      <h2 className="font-heading text-xl font-semibold text-[#F8FAFC]">
        Practice Area
      </h2>
      <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
        {skills.map((skill, i) => {
          const Icon = skill.icon;
          return (
            <div
              key={skill.name}
              className={`animate-fade-up ${staggerClass[i]} group cursor-pointer rounded-xl border-[0.5px] border-[#2A3150] bg-[#1E2540] p-4 transition-all duration-200 ease-out hover:-translate-y-0.5 hover:border-[rgba(99,102,241,0.3)]`}
            >
              <div
                className="flex h-10 w-10 items-center justify-center rounded-[10px] transition-transform duration-200 ease-out group-hover:scale-110"
                style={{ backgroundColor: skill.bg }}
              >
                <Icon size={20} strokeWidth={1.75} style={{ color: skill.color }} />
              </div>
              <p className="mt-3 text-[15px] font-medium text-[#F8FAFC]">
                {skill.name}
              </p>
              <p className="mt-0.5 text-xs text-[#64748B]">Start Practice</p>
            </div>
          );
        })}
      </div>
    </section>
  );
}

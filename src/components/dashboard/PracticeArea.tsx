import Link from "next/link";
import { Mic, PenLine, BookOpen, Headphones } from "lucide-react";

const skills = [
  {
    name: "Speaking",
    icon: Mic,
    color: "#0F766E",
    bg: "rgba(15,118,110,0.15)",
    href: "/dashboard/speaking",
  },
  {
    name: "Writing",
    icon: PenLine,
    color: "#C2410C",
    bg: "rgba(194,65,12,0.15)",
    href: "/dashboard/writing",
  },
  {
    name: "Reading",
    icon: BookOpen,
    color: "#B45309",
    bg: "rgba(180,83,9,0.15)",
    href: "/dashboard/reading",
  },
  {
    name: "Listening",
    icon: Headphones,
    color: "#047857",
    bg: "rgba(4,120,87,0.15)",
    href: "/dashboard/listening",
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
      <h2 className="font-heading text-xl font-semibold text-[#292524]">
        Practice Area
      </h2>
      <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
        {skills.map((skill, i) => {
          const Icon = skill.icon;
          return (
            <Link
              key={skill.name}
              href={skill.href}
              className={`animate-fade-up ${staggerClass[i]} group cursor-pointer rounded-xl border-[0.5px] border-[#E7E5E4] bg-[#FDF8F2] p-4 transition-all duration-200 ease-out hover:-translate-y-0.5 hover:border-[rgba(4,120,87,0.28)]`}
            >
              <div
                className="flex h-10 w-10 items-center justify-center rounded-[10px] transition-transform duration-200 ease-out group-hover:scale-110"
                style={{ backgroundColor: skill.bg }}
              >
                <Icon size={20} strokeWidth={1.75} style={{ color: skill.color }} />
              </div>
              <p className="mt-3 text-[15px] font-medium text-[#292524]">
                {skill.name}
              </p>
              <p className="mt-0.5 text-xs text-[#78716C]">Start Practice</p>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

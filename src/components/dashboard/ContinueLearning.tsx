import { Mic, PenLine, BookOpen, Headphones, ChevronRight } from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface LearningItem {
  skill: string;
  title: string;
  progress: string;
  completed: number;
  total: number;
  icon: LucideIcon;
  color: string;
  bg: string;
}

const items: LearningItem[] = [
  {
    skill: "Listening",
    title: "IELTS Book 10 Test 1",
    progress: "0/44 tests completed",
    completed: 0,
    total: 44,
    icon: Headphones,
    color: "#22C55E",
    bg: "rgba(34,197,94,0.15)",
  },
  {
    skill: "Reading",
    title: "History/Architecture",
    progress: "0/132 passages completed",
    completed: 0,
    total: 132,
    icon: BookOpen,
    color: "#A855F7",
    bg: "rgba(168,85,247,0.15)",
  },
  {
    skill: "Writing",
    title: "Test 1 Task 1",
    progress: "0/88 tasks completed",
    completed: 0,
    total: 88,
    icon: PenLine,
    color: "#F97316",
    bg: "rgba(249,115,22,0.15)",
  },
  {
    skill: "Speaking",
    title: "IELTS Book 10 Test 1",
    progress: "0/44 tests completed",
    completed: 0,
    total: 44,
    icon: Mic,
    color: "#0EA5E9",
    bg: "rgba(14,165,233,0.15)",
  },
];

const staggerClass = [
  "animate-fade-up-6",
  "animate-fade-up-7",
  "animate-fade-up-8",
  "animate-fade-up-9",
];

export default function ContinueLearning() {
  return (
    <section className="mt-8">
      <h2 className="font-heading text-xl font-semibold text-[#F8FAFC]">
        Continue Learning
      </h2>
      <div className="mt-4 flex flex-col gap-3">
        {items.map((item, i) => {
          const Icon = item.icon;
          const percent = (item.completed / item.total) * 100;

          return (
            <div
              key={i}
              className={`animate-fade-up ${staggerClass[i]} group flex cursor-pointer items-center gap-4 rounded-xl border-[0.5px] border-[#2A3150] bg-[#1E2540] p-4 transition-all duration-200 ease-out hover:-translate-y-0.5 hover:border-[rgba(99,102,241,0.3)] hover:bg-[#232948]`}
            >
              <div
                className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-[10px]"
                style={{ backgroundColor: item.bg }}
              >
                <Icon size={20} strokeWidth={1.75} style={{ color: item.color }} />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span
                    className="rounded-full px-2.5 py-0.5 text-[11px] font-medium text-white"
                    style={{ backgroundColor: item.color }}
                  >
                    {item.skill}
                  </span>
                </div>
                <p className="mt-1.5 text-[15px] font-medium text-[#F8FAFC] truncate">
                  {item.title}
                </p>
                <p className="mt-1 text-xs text-[#64748B]">{item.progress}</p>
                <div className="mt-2 h-1 w-full rounded-full bg-[#2A3150]">
                  <div
                    className="animate-progress-bar h-1 rounded-full"
                    style={{
                      width: `${percent}%`,
                      backgroundColor: item.color,
                      animationDelay: `${0.7 + i * 0.1}s`,
                    }}
                  />
                </div>
              </div>

              <ChevronRight
                size={20}
                strokeWidth={1.75}
                className="flex-shrink-0 text-[#64748B] transition-transform duration-200 group-hover:translate-x-0.5"
              />
            </div>
          );
        })}
      </div>
    </section>
  );
}

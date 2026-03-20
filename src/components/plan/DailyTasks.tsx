import { Headphones, PenLine, BookOpen, Mic } from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface DailyTask {
  skill: string;
  title: string;
  icon: LucideIcon;
  color: string;
  bg: string;
}

const tasks: DailyTask[] = [
  {
    skill: "Listening",
    title: "IELTS Book 10 Test 1",
    icon: Headphones,
    color: "#22C55E",
    bg: "rgba(34,197,94,0.15)",
  },
  {
    skill: "Writing",
    title: "IELTS Book 10 Test 1 (Full Test)",
    icon: PenLine,
    color: "#F97316",
    bg: "rgba(249,115,22,0.15)",
  },
  {
    skill: "Reading",
    title: "History/Architecture",
    icon: BookOpen,
    color: "#A855F7",
    bg: "rgba(168,85,247,0.15)",
  },
  {
    skill: "Speaking",
    title: "IELTS Book 10 Test 1",
    icon: Mic,
    color: "#0EA5E9",
    bg: "rgba(14,165,233,0.15)",
  },
];

const staggerClass = [
  "animate-fade-up-5",
  "animate-fade-up-6",
  "animate-fade-up-7",
  "animate-fade-up-8",
];

export default function DailyTasks() {
  return (
    <section className="mt-6">
      <div className="animate-fade-up animate-fade-up-4 flex items-start gap-4">
        <div className="flex flex-col items-center">
          <div className="flex h-12 w-12 flex-col items-center justify-center rounded-full bg-[#EF4444] text-white">
            <span className="text-[11px] font-medium leading-none">Sat</span>
            <span className="text-base font-bold leading-tight">21</span>
          </div>
          <div className="h-6 w-px border-l border-dashed border-[#2A3150]" />
        </div>
        <p className="pt-3 text-sm font-medium text-[#F8FAFC]">Today</p>
      </div>

      <div className="relative ml-6 border-l border-dashed border-[#2A3150] pl-7">
        {tasks.map((task, i) => {
          const Icon = task.icon;
          return (
            <div key={i} className={`animate-fade-up ${staggerClass[i]} pb-3`}>
              <div className="absolute left-[-3px] mt-5 h-1.5 w-1.5 rounded-full bg-[#EF4444]" />
              <div className="group flex cursor-pointer items-center gap-4 rounded-xl border-[0.5px] border-[#2A3150] bg-[#1E2540] p-4 transition-all duration-200 ease-out hover:-translate-y-0.5 hover:border-[rgba(99,102,241,0.3)]">
                <div
                  className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-[10px]"
                  style={{ backgroundColor: task.bg }}
                >
                  <Icon size={20} strokeWidth={1.75} style={{ color: task.color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-[rgba(239,68,68,0.15)] px-2.5 py-0.5 text-[11px] font-medium text-[#EF4444]">
                      Today&apos;s Task
                    </span>
                  </div>
                  <p className="mt-1.5 text-[15px] font-medium text-[#F8FAFC] truncate">
                    {task.skill}: {task.title}
                  </p>
                </div>
                <div className="h-2 w-2 flex-shrink-0 rounded-full bg-[#EF4444]" />
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

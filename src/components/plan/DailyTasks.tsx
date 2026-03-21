import { Headphones, PenLine, BookOpen, Mic, Clock } from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface Task {
  skill: string;
  taskTitle: string;
  duration: string;
  description: string;
  priority: string;
}

interface DailyTasksProps {
  tasks: Task[];
}

const skillConfig: Record<string, { icon: LucideIcon; color: string; bg: string }> = {
  listening: { icon: Headphones, color: "#22C55E", bg: "rgba(34,197,94,0.15)" },
  writing: { icon: PenLine, color: "#F97316", bg: "rgba(249,115,22,0.15)" },
  reading: { icon: BookOpen, color: "#A855F7", bg: "rgba(168,85,247,0.15)" },
  speaking: { icon: Mic, color: "#0EA5E9", bg: "rgba(14,165,233,0.15)" },
};

const priorityConfig: Record<string, { color: string; bg: string }> = {
  high: { color: "#EF4444", bg: "rgba(239,68,68,0.15)" },
  medium: { color: "#F59E0B", bg: "rgba(245,158,11,0.15)" },
  low: { color: "#22C55E", bg: "rgba(34,197,94,0.15)" },
};

const staggerClasses = [
  "animate-fade-up-5",
  "animate-fade-up-6",
  "animate-fade-up-7",
  "animate-fade-up-8",
  "animate-fade-up-9",
];

export default function DailyTasks({ tasks }: DailyTasksProps) {
  const now = new Date();
  const dayShort = now.toLocaleDateString("en-US", { weekday: "short" });
  const dayNum = now.getDate();

  if (tasks.length === 0) {
    return (
      <section className="mt-6">
        <div className="animate-fade-up animate-fade-up-4 rounded-xl border-[0.5px] border-[#2A3150] bg-[#1E2540] p-6 text-center">
          <p className="text-[15px] text-[#94A3B8]">No tasks scheduled for today</p>
          <p className="mt-1 text-[13px] text-[#64748B]">Enjoy your rest day!</p>
        </div>
      </section>
    );
  }

  return (
    <section className="mt-6">
      <div className="animate-fade-up animate-fade-up-4 flex items-start gap-4">
        <div className="flex flex-col items-center">
          <div className="flex h-12 w-12 flex-col items-center justify-center rounded-full bg-[#6366F1] text-white">
            <span className="text-[11px] font-medium leading-none">{dayShort}</span>
            <span className="text-base font-bold leading-tight">{dayNum}</span>
          </div>
          <div className="h-6 w-px border-l border-dashed border-[#2A3150]" />
        </div>
        <p className="pt-3 text-sm font-medium text-[#F8FAFC]">Today</p>
      </div>

      <div className="relative ml-6 border-l border-dashed border-[#2A3150] pl-7">
        {tasks.map((task, i) => {
          const config = skillConfig[task.skill] || skillConfig.reading;
          const pConfig = priorityConfig[task.priority] || priorityConfig.medium;
          const Icon = config.icon;
          const stagger = staggerClasses[i] || staggerClasses[staggerClasses.length - 1];

          return (
            <div key={i} className={`animate-fade-up ${stagger} pb-3`}>
              <div className="absolute left-[-3px] mt-5 h-1.5 w-1.5 rounded-full bg-[#6366F1]" />
              <div className="group flex cursor-pointer items-center gap-4 rounded-xl border-[0.5px] border-[#2A3150] bg-[#1E2540] p-4 transition-all duration-200 ease-out hover:-translate-y-0.5 hover:border-[rgba(99,102,241,0.3)]">
                <div
                  className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-[10px]"
                  style={{ backgroundColor: config.bg }}
                >
                  <Icon size={20} strokeWidth={1.75} style={{ color: config.color }} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span
                      className="rounded-full px-2.5 py-0.5 text-[11px] font-medium capitalize"
                      style={{ backgroundColor: pConfig.bg, color: pConfig.color }}
                    >
                      {task.priority}
                    </span>
                    <span className="flex items-center gap-1 text-[11px] text-[#64748B]">
                      <Clock size={10} strokeWidth={1.75} />
                      {task.duration}
                    </span>
                  </div>
                  <p className="mt-1.5 truncate text-[15px] font-medium text-[#F8FAFC]">
                    {task.taskTitle}
                  </p>
                  <p className="mt-0.5 truncate text-[12px] text-[#64748B]">
                    {task.description}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

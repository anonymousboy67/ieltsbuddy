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
  listening: { icon: Headphones, color: "#047857", bg: "#D1FAE5" },
  writing: { icon: PenLine, color: "#C2410C", bg: "#FFEDD5" },
  reading: { icon: BookOpen, color: "#B45309", bg: "#FEF3C7" },
  speaking: { icon: Mic, color: "#0F766E", bg: "#CCFBF1" },
};

const priorityConfig: Record<string, { color: string; bg: string }> = {
  high: { color: "#B91C1C", bg: "#FEE2E2" },
  medium: { color: "#B45309", bg: "#FEF3C7" },
  low: { color: "#047857", bg: "#D1FAE5" },
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
        <div className="panel animate-fade-up animate-fade-up-4 p-6 text-center">
          <p className="text-[15px] text-stone-700">No tasks scheduled for today</p>
          <p className="mt-1 text-[13px] text-stone-500">Enjoy your rest day!</p>
        </div>
      </section>
    );
  }

  return (
    <section className="mt-6">
      <div className="animate-fade-up animate-fade-up-4 flex items-start gap-4">
        <div className="flex flex-col items-center">
          <div className="flex h-12 w-12 flex-col items-center justify-center rounded-full bg-emerald-700 text-white">
            <span className="text-[11px] font-medium leading-none">{dayShort}</span>
            <span className="text-base font-bold leading-tight">{dayNum}</span>
          </div>
          <div className="h-6 w-px border-l border-dashed border-stone-300" />
        </div>
        <p className="pt-3 text-sm font-medium text-stone-800">Today</p>
      </div>

      <div className="relative ml-6 border-l border-dashed border-stone-300 pl-7">
        {tasks.map((task, i) => {
          const config = skillConfig[task.skill] || skillConfig.reading;
          const pConfig = priorityConfig[task.priority] || priorityConfig.medium;
          const Icon = config.icon;
          const stagger = staggerClasses[i] || staggerClasses[staggerClasses.length - 1];

          return (
            <div key={i} className={`animate-fade-up ${stagger} pb-3`}>
              <div className="absolute left-[-3px] mt-5 h-1.5 w-1.5 rounded-full bg-emerald-700" />
              <div className="group flex cursor-pointer items-center gap-4 rounded-2xl border border-stone-200 bg-[#FDF8F2] p-4 shadow-[0_2px_10px_rgba(0,0,0,0.04)] transition-all duration-200 ease-out hover:-translate-y-0.5 hover:bg-stone-50">
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
                    <span className="flex items-center gap-1 text-[11px] text-stone-500">
                      <Clock size={10} strokeWidth={1.75} />
                      {task.duration}
                    </span>
                  </div>
                  <p className="mt-1.5 truncate font-heading text-[15px] font-medium text-stone-800">
                    {task.taskTitle}
                  </p>
                  <p className="mt-0.5 truncate text-[12px] text-stone-600">
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

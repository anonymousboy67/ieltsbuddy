import { Target, Calendar, RotateCcw } from "lucide-react";
import SkillStats from "@/components/plan/SkillStats";
import WeekProgress from "@/components/plan/WeekProgress";
import DailyTasks from "@/components/plan/DailyTasks";

export default function PlanPage() {
  return (
    <>
      <div className="animate-fade-up">
        <h1 className="font-heading text-[28px] font-bold text-[#F8FAFC]">
          Your Study Plan
        </h1>
        <div className="mt-3 flex items-center gap-5">
          <span className="flex items-center gap-1.5 text-sm font-medium text-[#6366F1]">
            <Target size={16} strokeWidth={1.75} />
            Band 7.5
          </span>
          <span className="flex items-center gap-1.5 text-sm text-[#94A3B8]">
            <Calendar size={16} strokeWidth={1.75} />
            Jun 19, 2026
          </span>
          <button
            className="ml-auto flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg border-[0.5px] border-[#2A3150] bg-[#1E2540] transition-all duration-200 hover:border-[rgba(99,102,241,0.3)] hover:bg-[#252B45]"
            aria-label="Reset plan"
          >
            <RotateCcw size={16} strokeWidth={1.75} className="text-[#94A3B8]" />
          </button>
        </div>
      </div>

      <div className="animate-fade-up animate-fade-up-1">
        <SkillStats />
      </div>
      <WeekProgress />
      <DailyTasks />
    </>
  );
}

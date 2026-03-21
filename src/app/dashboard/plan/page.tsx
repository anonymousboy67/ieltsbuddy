"use client";

import { useState, useEffect, useCallback } from "react";
import { Target, Calendar, RotateCcw, Brain, Loader2 } from "lucide-react";
import SkillStats from "@/components/plan/SkillStats";
import WeekProgress from "@/components/plan/WeekProgress";
import DailyTasks from "@/components/plan/DailyTasks";
import type { IStudyPlan } from "@/models/User";

interface PlanData {
  plan: IStudyPlan | null;
  targetBand: number;
  testDate: string | null;
}

export default function PlanPage() {
  const [data, setData] = useState<PlanData | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPlan = useCallback(async () => {
    const userId = localStorage.getItem("userId");
    if (!userId) {
      setLoading(false);
      setError("No user profile found. Please complete onboarding first.");
      return;
    }

    try {
      const res = await fetch(`/api/study-plan?userId=${userId}`);
      const result = await res.json();
      if (!res.ok) throw new Error(result.error);

      if (result.plan) {
        setData(result);
        setLoading(false);
      } else {
        await generatePlan(userId);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load plan");
      setLoading(false);
    }
  }, []);

  async function generatePlan(userId?: string) {
    const id = userId || localStorage.getItem("userId");
    if (!id) return;

    setGenerating(true);
    setError(null);
    try {
      const res = await fetch("/api/study-plan/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: id }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error);
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate plan");
    } finally {
      setGenerating(false);
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchPlan();
  }, [fetchPlan]);

  if (loading || generating) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center gap-4">
        {generating ? (
          <>
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[rgba(99,102,241,0.15)]">
              <Brain size={32} strokeWidth={1.75} className="animate-pulse text-[#6366F1]" />
            </div>
            <p className="text-[15px] font-medium text-[#F8FAFC]">
              AI is creating your personalized plan...
            </p>
            <p className="animate-loading-pulse text-[13px] text-[#64748B]">
              This may take a few seconds
            </p>
          </>
        ) : (
          <Loader2 size={32} strokeWidth={1.75} className="animate-spin text-[#6366F1]" />
        )}
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center gap-4">
        <p className="text-[15px] text-[#EF4444]">{error}</p>
        <button
          onClick={() => {
            setLoading(true);
            setError(null);
            fetchPlan();
          }}
          className="rounded-xl bg-[#6366F1] px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-[#818CF8]"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (!data?.plan) return null;

  const { plan, targetBand, testDate } = data;

  const today = new Date().toLocaleDateString("en-US", { weekday: "long" });
  const todayPlan = plan.weeklyPlan.find((d) => d.day === today);
  const totalTasks = plan.weeklyPlan.reduce((sum, d) => sum + d.tasks.length, 0);

  // Count tasks per skill
  const skillCounts = { listening: 0, reading: 0, writing: 0, speaking: 0 };
  for (const day of plan.weeklyPlan) {
    for (const task of day.tasks) {
      if (task.skill in skillCounts) {
        skillCounts[task.skill as keyof typeof skillCounts]++;
      }
    }
  }

  const formattedDate = testDate
    ? new Date(testDate).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : "Not set";

  return (
    <>
      <div className="animate-fade-up">
        <h1 className="font-heading text-[28px] font-bold text-[#F8FAFC]">
          Your Study Plan
        </h1>
        <div className="mt-3 flex items-center gap-5">
          <span className="flex items-center gap-1.5 text-sm font-medium text-[#6366F1]">
            <Target size={16} strokeWidth={1.75} />
            Band {targetBand}
          </span>
          <span className="flex items-center gap-1.5 text-sm text-[#94A3B8]">
            <Calendar size={16} strokeWidth={1.75} />
            {formattedDate}
          </span>
          <button
            onClick={() => generatePlan()}
            disabled={generating}
            className="ml-auto flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg border-[0.5px] border-[#2A3150] bg-[#1E2540] transition-all duration-200 hover:border-[rgba(99,102,241,0.3)] hover:bg-[#252B45] disabled:opacity-50"
            aria-label="Regenerate plan"
          >
            <RotateCcw
              size={16}
              strokeWidth={1.75}
              className={`text-[#94A3B8] ${generating ? "animate-spin" : ""}`}
            />
          </button>
        </div>
      </div>

      <div className="animate-fade-up animate-fade-up-1">
        <SkillStats
          listening={skillCounts.listening}
          reading={skillCounts.reading}
          writing={skillCounts.writing}
          speaking={skillCounts.speaking}
        />
      </div>
      <WeekProgress done={0} total={totalTasks} />
      <DailyTasks tasks={todayPlan?.tasks || []} />
    </>
  );
}

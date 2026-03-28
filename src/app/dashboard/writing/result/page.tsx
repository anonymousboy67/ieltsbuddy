"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle,
  AlertTriangle,
  PenLine,
  Loader2,
} from "lucide-react";
import type { WritingEvaluation } from "@/lib/claude";

function BandScoreGauge({ score }: { score: number }) {
  const [animatedScore, setAnimatedScore] = useState(0);
  const radius = 70;
  const circumference = 2 * Math.PI * radius;
  const progress = score / 9;
  const strokeDashoffset = circumference - progress * circumference;

  useEffect(() => {
    const duration = 1200;
    const start = performance.now();
    function animate(now: number) {
      const elapsed = now - start;
      const t = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      setAnimatedScore(Math.round(eased * score * 10) / 10);
      if (t < 1) requestAnimationFrame(animate);
    }
    const timer = setTimeout(() => requestAnimationFrame(animate), 300);
    return () => clearTimeout(timer);
  }, [score]);

  function getScoreColor(s: number) {
    if (s < 5) return "#EF4444";
    if (s < 6) return "#F59E0B";
    if (s < 7) return "#F59E0B";
    return "#22C55E";
  }

  const color = getScoreColor(score);

  return (
    <div className="relative flex items-center justify-center">
      <svg width="180" height="180" className="-rotate-90">
        <circle
          cx="90"
          cy="90"
          r={radius}
          fill="none"
          stroke="#1E2540"
          strokeWidth="10"
        />
        <circle
          cx="90"
          cy="90"
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          className="animate-gauge-ring"
          style={{
            "--gauge-circumference": circumference,
            "--gauge-target": strokeDashoffset,
          } as React.CSSProperties}
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span
          className="text-4xl font-bold"
          style={{ color }}
        >
          {animatedScore.toFixed(1)}
        </span>
        <span className="text-xs text-[#64748B]">Overall Band</span>
      </div>
    </div>
  );
}

function CriteriaCard({
  title,
  band,
  feedback,
  delay,
}: {
  title: string;
  band: number;
  feedback: string;
  delay: string;
}) {
  function getScoreColor(s: number) {
    if (s < 5) return "#EF4444";
    if (s < 6) return "#F59E0B";
    if (s < 7) return "#F59E0B";
    return "#22C55E";
  }

  return (
    <div
      className={`animate-fade-up ${delay} rounded-xl border-[0.5px] border-[#2A3150] bg-[#1E2540] p-4`}
    >
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-[#F8FAFC]">{title}</h3>
        <span
          className="text-lg font-bold"
          style={{ color: getScoreColor(band) }}
        >
          {band.toFixed(1)}
        </span>
      </div>
      <p className="mt-2 text-[13px] leading-relaxed text-[#94A3B8]">
        {feedback}
      </p>
    </div>
  );
}

export default function WritingResultPage() {
  const [evaluation, setEvaluation] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadResult() {
      const urlParams = new URLSearchParams(window.location.search);
      const attemptId = urlParams.get("attemptId");

      if (attemptId) {
        // Fetch from API
        try {
          const res = await fetch(`/api/attempts/${attemptId}`);
          if (res.ok) {
            const attempt = await res.json();
            if (attempt.writingFeedback) {
              setEvaluation({
                overallBand: attempt.writingFeedback.bandScore || attempt.bandScore,
                taskAchievement: attempt.writingFeedback.taskAchievement,
                coherenceCohesion: attempt.writingFeedback.coherenceCohesion,
                lexicalResource: attempt.writingFeedback.lexicalResource,
                grammaticalRange: attempt.writingFeedback.grammaticalRange,
                strengths: [], // Worker should eventually populate these
                improvements: attempt.writingFeedback.overallFeedback ? [attempt.writingFeedback.overallFeedback] : [],
                correctedVersion: attempt.writingResponse || "",
              });
            }
          }
        } catch (err) {
          console.error("Failed to fetch attempt:", err);
        }
      } else {
        // Fallback to localStorage (old way)
        const stored = localStorage.getItem("writingEvaluation");
        if (stored) {
          try {
            setEvaluation(JSON.parse(stored));
          } catch {
            // invalid data
          }
        }
      }
      setLoading(false);
    }

    loadResult();
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-[#6366F1]" />
        <p className="text-[#64748B]">Loading your assessment...</p>
      </div>
    );
  }

  if (!evaluation) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <p className="text-[#64748B]">No evaluation data found.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl">
      <div className="animate-fade-up flex items-center gap-3">
        <Link
          href="/dashboard/writing"
          className="flex h-10 w-10 items-center justify-center rounded-full border-[0.5px] border-[#2A3150] bg-[#1E2540] transition-all duration-200 hover:border-[rgba(99,102,241,0.3)]"
        >
          <ArrowLeft size={20} strokeWidth={1.75} className="text-[#94A3B8]" />
        </Link>
        <h1 className="text-base font-medium text-[#F8FAFC]">
          Evaluation Result
        </h1>
      </div>

      {/* Overall Band Score */}
      <div className="animate-fade-up animate-fade-up-1 mt-8 flex flex-col items-center">
        <BandScoreGauge score={evaluation.overallBand} />
      </div>

      {/* Criteria Cards */}
      <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <CriteriaCard
          title="Task Achievement"
          band={evaluation.taskAchievement.band}
          feedback={evaluation.taskAchievement.feedback}
          delay="animate-fade-up-2"
        />
        <CriteriaCard
          title="Coherence & Cohesion"
          band={evaluation.coherenceCohesion.band}
          feedback={evaluation.coherenceCohesion.feedback}
          delay="animate-fade-up-3"
        />
        <CriteriaCard
          title="Lexical Resource"
          band={evaluation.lexicalResource.band}
          feedback={evaluation.lexicalResource.feedback}
          delay="animate-fade-up-4"
        />
        <CriteriaCard
          title="Grammatical Range"
          band={evaluation.grammaticalRange.band}
          feedback={evaluation.grammaticalRange.feedback}
          delay="animate-fade-up-5"
        />
      </div>

      {/* Strengths */}
      <div className="animate-fade-up animate-fade-up-6 mt-8">
        <h2 className="flex items-center gap-2 text-base font-semibold text-[#F8FAFC]">
          <CheckCircle size={20} strokeWidth={1.75} className="text-[#22C55E]" />
          Strengths
        </h2>
        <ul className="mt-3 space-y-2">
          {evaluation.strengths.map((s: string, i: number) => (
            <li
              key={i}
              className="flex items-start gap-2.5 rounded-lg border-[0.5px] border-[rgba(34,197,94,0.2)] bg-[rgba(34,197,94,0.05)] px-4 py-3 text-[13px] text-[#94A3B8]"
            >
              <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#22C55E]" />
              {s}
            </li>
          ))}
        </ul>
      </div>

      {/* Areas for Improvement */}
      <div className="animate-fade-up animate-fade-up-7 mt-6">
        <h2 className="flex items-center gap-2 text-base font-semibold text-[#F8FAFC]">
          <AlertTriangle size={20} strokeWidth={1.75} className="text-[#F59E0B]" />
          Areas for Improvement
        </h2>
        <ul className="mt-3 space-y-2">
          {evaluation.improvements.map((imp: string, i: number) => (
            <li
              key={i}
              className="flex items-start gap-2.5 rounded-lg border-[0.5px] border-[rgba(245,158,11,0.2)] bg-[rgba(245,158,11,0.05)] px-4 py-3 text-[13px] text-[#94A3B8]"
            >
              <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#F59E0B]" />
              {imp}
            </li>
          ))}
        </ul>
      </div>

      {/* Corrected Version */}
      <div className="animate-fade-up animate-fade-up-8 mt-6">
        <h2 className="flex items-center gap-2 text-base font-semibold text-[#F8FAFC]">
          <PenLine size={20} strokeWidth={1.75} className="text-[#6366F1]" />
          Corrected Version
        </h2>
        <div className="mt-3 rounded-xl border-[0.5px] border-[#2A3150] bg-[#12172B] p-5">
          <p className="whitespace-pre-wrap text-[14px] leading-relaxed text-[#94A3B8] italic">
            {evaluation.correctedVersion}
          </p>
        </div>
      </div>

      {/* Practice Again */}
      <div className="animate-fade-up animate-fade-up-9 mt-8 pb-8">
        <Link
          href="/dashboard/writing"
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#6366F1] px-6 py-3 text-[15px] font-medium text-white transition-colors duration-200 hover:bg-[#818CF8]"
        >
          Practice Again
        </Link>
      </div>
    </div>
  );
}

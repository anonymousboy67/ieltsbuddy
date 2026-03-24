"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle,
  AlertTriangle,
  PenLine,
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
    if (s < 5) return "#B91C1C";
    if (s < 6) return "#B45309";
    if (s < 7) return "#B45309";
    return "#047857";
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
          stroke="#FFFFFF"
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
        <span className="text-xs text-[#78716C]">Overall Band</span>
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
    if (s < 5) return "#B91C1C";
    if (s < 6) return "#B45309";
    if (s < 7) return "#B45309";
    return "#047857";
  }

  return (
    <div
      className={`animate-fade-up ${delay} rounded-xl border-[0.5px] border-[#E7E5E4] bg-[#FDF8F2] p-4`}
    >
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-[#292524]">{title}</h3>
        <span
          className="text-lg font-bold"
          style={{ color: getScoreColor(band) }}
        >
          {band.toFixed(1)}
        </span>
      </div>
      <p className="mt-2 text-[13px] leading-relaxed text-[#57534E]">
        {feedback}
      </p>
    </div>
  );
}

export default function WritingResultPage() {
  const [evaluation, setEvaluation] = useState<WritingEvaluation | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem("writingEvaluation");
    if (stored) {
      try {
        setEvaluation(JSON.parse(stored));
      } catch {
        // invalid data
      }
    }
  }, []);

  if (!evaluation) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <p className="text-[#78716C]">No evaluation data found.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl">
      <div className="animate-fade-up flex items-center gap-3">
        <Link
          href="/dashboard/writing"
          className="flex h-10 w-10 items-center justify-center rounded-full border-[0.5px] border-[#E7E5E4] bg-[#FDF8F2] transition-all duration-200 hover:border-[rgba(4,120,87,0.28)]"
        >
          <ArrowLeft size={20} strokeWidth={1.75} className="text-[#57534E]" />
        </Link>
        <h1 className="text-base font-medium text-[#292524]">
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
        <h2 className="flex items-center gap-2 text-base font-semibold text-[#292524]">
          <CheckCircle size={20} strokeWidth={1.75} className="text-[#047857]" />
          Strengths
        </h2>
        <ul className="mt-3 space-y-2">
          {evaluation.strengths.map((s, i) => (
            <li
              key={i}
              className="flex items-start gap-2.5 rounded-lg border-[0.5px] border-[rgba(4,120,87,0.20)] bg-[rgba(4,120,87,0.08)] px-4 py-3 text-[13px] text-[#57534E]"
            >
              <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#047857]" />
              {s}
            </li>
          ))}
        </ul>
      </div>

      {/* Areas for Improvement */}
      <div className="animate-fade-up animate-fade-up-7 mt-6">
        <h2 className="flex items-center gap-2 text-base font-semibold text-[#292524]">
          <AlertTriangle size={20} strokeWidth={1.75} className="text-[#B45309]" />
          Areas for Improvement
        </h2>
        <ul className="mt-3 space-y-2">
          {evaluation.improvements.map((imp, i) => (
            <li
              key={i}
              className="flex items-start gap-2.5 rounded-lg border-[0.5px] border-[rgba(180,83,9,0.22)] bg-[rgba(180,83,9,0.08)] px-4 py-3 text-[13px] text-[#57534E]"
            >
              <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#B45309]" />
              {imp}
            </li>
          ))}
        </ul>
      </div>

      {/* Corrected Version */}
      <div className="animate-fade-up animate-fade-up-8 mt-6">
        <h2 className="flex items-center gap-2 text-base font-semibold text-[#292524]">
          <PenLine size={20} strokeWidth={1.75} className="text-[#047857]" />
          Corrected Version
        </h2>
        <div className="mt-3 rounded-xl border-[0.5px] border-[#E7E5E4] bg-[#F8F5F1] p-5">
          <p className="whitespace-pre-wrap text-[14px] leading-relaxed text-[#57534E] italic">
            {evaluation.correctedVersion}
          </p>
        </div>
      </div>

      {/* Practice Again */}
      <div className="animate-fade-up animate-fade-up-9 mt-8 pb-8">
        <Link
          href="/dashboard/writing"
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#047857] px-6 py-3 text-[15px] font-medium text-white transition-colors duration-200 hover:bg-[#0F766E]"
        >
          Practice Again
        </Link>
      </div>
    </div>
  );
}

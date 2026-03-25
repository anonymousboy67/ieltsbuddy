"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Mic,
  PenLine,
  BarChart3,
  TrendingUp,
  Clock,
  BookOpen,
  ChevronDown,
  ChevronUp,
  Trophy,
  Target,
  Zap,
} from "lucide-react";

/* ── Types ─────────────────────────────────────────────────────── */

interface CriteriaScore {
  score: number;
  feedback: string;
}

interface Attempt {
  _id: string;
  sectionType: "speaking" | "writing" | "reading" | "listening";
  bandScore: number;
  bookNumber?: number;
  testNumber?: number;
  completedAt?: string;
  createdAt: string;
  speakingFeedback?: {
    fluencyCoherence: CriteriaScore;
    lexicalResource: CriteriaScore;
    grammaticalRange: CriteriaScore;
    pronunciation: CriteriaScore;
    overallFeedback: string;
  };
  writingFeedback?: {
    taskAchievement: CriteriaScore;
    coherenceCohesion: CriteriaScore;
    lexicalResource: CriteriaScore;
    grammaticalRange: CriteriaScore;
    overallFeedback: string;
  };
}

/* ── Helpers ────────────────────────────────────────────────────── */

function bandColor(band: number): string {
  if (band >= 8) return "#22C55E";
  if (band >= 7) return "#6366F1";
  if (band >= 6) return "#F59E0B";
  return "#EF4444";
}

function formatDate(iso: string): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

function skillLabel(type: string): string {
  return type.charAt(0).toUpperCase() + type.slice(1);
}

/* ── SVG Progress Chart ─────────────────────────────────────────── */

function BandChart({ attempts }: { attempts: Attempt[] }) {
  // Only use attempts that have a band score, most recent last for chart
  const chartData = [...attempts]
    .filter((a) => a.bandScore)
    .reverse()
    .slice(-15); // last 15

  if (chartData.length < 2) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-sm text-[#64748B]">
          Complete at least 2 sessions to see your progress chart
        </p>
      </div>
    );
  }

  const W = 560;
  const H = 160;
  const PAD = { top: 20, right: 20, bottom: 30, left: 36 };
  const innerW = W - PAD.left - PAD.right;
  const innerH = H - PAD.top - PAD.bottom;

  const minBand = Math.max(0, Math.min(...chartData.map((d) => d.bandScore)) - 1);
  const maxBand = Math.min(9, Math.max(...chartData.map((d) => d.bandScore)) + 1);

  const xOf = (i: number) => PAD.left + (i / (chartData.length - 1)) * innerW;
  const yOf = (b: number) =>
    PAD.top + innerH - ((b - minBand) / (maxBand - minBand)) * innerH;

  const points = chartData.map((d, i) => `${xOf(i)},${yOf(d.bandScore)}`).join(" ");
  const firstX = xOf(0);
  const firstY = yOf(chartData[0].bandScore);
  const lastX = xOf(chartData.length - 1);
  const lastY = yOf(chartData[chartData.length - 1].bandScore);

  // Area path
  const areaPath = `M ${firstX} ${yOf(minBand)} L ${firstX} ${firstY} ${chartData
    .slice(1)
    .map((d, i) => `L ${xOf(i + 1)} ${yOf(d.bandScore)}`)
    .join(" ")} L ${lastX} ${yOf(minBand)} Z`;

  // Gridline bands
  const gridBands = [6, 7, 8];

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="w-full"
      style={{ maxHeight: 160 }}
      preserveAspectRatio="xMidYMid meet"
    >
      <defs>
        <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#6366F1" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#6366F1" stopOpacity="0.02" />
        </linearGradient>
      </defs>

      {/* Grid lines */}
      {gridBands.map((b) =>
        b >= minBand && b <= maxBand ? (
          <g key={b}>
            <line
              x1={PAD.left}
              x2={W - PAD.right}
              y1={yOf(b)}
              y2={yOf(b)}
              stroke="#2A3150"
              strokeWidth="1"
              strokeDasharray="4 4"
            />
            <text
              x={PAD.left - 6}
              y={yOf(b) + 4}
              textAnchor="end"
              fill="#64748B"
              fontSize="10"
            >
              {b}
            </text>
          </g>
        ) : null
      )}

      {/* Area fill */}
      <path d={areaPath} fill="url(#chartGrad)" />

      {/* Line */}
      <polyline
        points={points}
        fill="none"
        stroke="#6366F1"
        strokeWidth="2.5"
        strokeLinejoin="round"
        strokeLinecap="round"
      />

      {/* Data points */}
      {chartData.map((d, i) => (
        <g key={d._id}>
          <circle
            cx={xOf(i)}
            cy={yOf(d.bandScore)}
            r="5"
            fill="#6366F1"
            stroke="#0B0F1A"
            strokeWidth="2"
          />
          {/* Band label on dot */}
          <text
            x={xOf(i)}
            y={yOf(d.bandScore) - 10}
            textAnchor="middle"
            fill="#F8FAFC"
            fontSize="9"
            fontWeight="600"
          >
            {d.bandScore}
          </text>
        </g>
      ))}

      {/* X axis date labels — show first and last */}
      <text
        x={firstX}
        y={H - 4}
        textAnchor="middle"
        fill="#64748B"
        fontSize="9"
      >
        {formatDate(chartData[0].createdAt).split(",")[0]}
      </text>
      <text
        x={lastX}
        y={H - 4}
        textAnchor="middle"
        fill="#64748B"
        fontSize="9"
      >
        {formatDate(chartData[chartData.length - 1].createdAt).split(",")[0]}
      </text>
    </svg>
  );
}

/* ── Attempt Card ───────────────────────────────────────────────── */

function AttemptCard({ attempt, index }: { attempt: Attempt; index: number }) {
  const [expanded, setExpanded] = useState(false);
  const isSpeaking = attempt.sectionType === "speaking";
  const isWriting = attempt.sectionType === "writing";
  const color = bandColor(attempt.bandScore);
  const date = attempt.completedAt || attempt.createdAt;

  const criteria = isSpeaking && attempt.speakingFeedback
    ? [
        { label: "Fluency & Coherence", score: attempt.speakingFeedback.fluencyCoherence?.score, feedback: attempt.speakingFeedback.fluencyCoherence?.feedback },
        { label: "Lexical Resource", score: attempt.speakingFeedback.lexicalResource?.score, feedback: attempt.speakingFeedback.lexicalResource?.feedback },
        { label: "Grammatical Range", score: attempt.speakingFeedback.grammaticalRange?.score, feedback: attempt.speakingFeedback.grammaticalRange?.feedback },
        { label: "Pronunciation", score: attempt.speakingFeedback.pronunciation?.score, feedback: attempt.speakingFeedback.pronunciation?.feedback },
      ]
    : isWriting && attempt.writingFeedback
    ? [
        { label: "Task Achievement", score: attempt.writingFeedback.taskAchievement?.score, feedback: attempt.writingFeedback.taskAchievement?.feedback },
        { label: "Coherence & Cohesion", score: attempt.writingFeedback.coherenceCohesion?.score, feedback: attempt.writingFeedback.coherenceCohesion?.feedback },
        { label: "Lexical Resource", score: attempt.writingFeedback.lexicalResource?.score, feedback: attempt.writingFeedback.lexicalResource?.feedback },
        { label: "Grammatical Range", score: attempt.writingFeedback.grammaticalRange?.score, feedback: attempt.writingFeedback.grammaticalRange?.feedback },
      ]
    : [];

  const overallFeedback =
    attempt.speakingFeedback?.overallFeedback ||
    attempt.writingFeedback?.overallFeedback;

  return (
    <div
      className="animate-fade-up rounded-xl border-[0.5px] border-[#2A3150] bg-[#1E2540] transition-all duration-200 hover:border-[rgba(99,102,241,0.3)]"
      style={{ animationDelay: `${index * 40}ms` }}
    >
      {/* Card header */}
      <div className="flex items-center gap-4 p-4">
        {/* Skill icon */}
        <div
          className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-[10px]"
          style={{
            backgroundColor:
              isSpeaking ? "rgba(14,165,233,0.15)" : "rgba(249,115,22,0.15)",
          }}
        >
          {isSpeaking ? (
            <Mic size={20} strokeWidth={1.75} style={{ color: "#0EA5E9" }} />
          ) : (
            <PenLine size={20} strokeWidth={1.75} style={{ color: "#F97316" }} />
          )}
        </div>

        {/* Title + date */}
        <div className="flex-1 min-w-0">
          <p className="text-[15px] font-medium text-[#F8FAFC]">
            {skillLabel(attempt.sectionType)} Practice
            {attempt.bookNumber
              ? ` — Book ${attempt.bookNumber}${attempt.testNumber ? `, Test ${attempt.testNumber}` : ""}`
              : ""}
          </p>
          <p className="mt-0.5 flex items-center gap-1.5 text-xs text-[#64748B]">
            <Clock size={11} strokeWidth={1.75} />
            {formatDate(date)}
          </p>
        </div>

        {/* Band badge */}
        <div className="flex flex-col items-center">
          <div
            className="flex h-12 w-12 items-center justify-center rounded-full border-2 font-bold text-lg"
            style={{ borderColor: color, color }}
          >
            {attempt.bandScore}
          </div>
          <span className="mt-0.5 text-[10px] text-[#64748B]">Band</span>
        </div>

        {/* Expand toggle */}
        {criteria.length > 0 && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="ml-1 flex h-8 w-8 items-center justify-center rounded-lg text-[#64748B] transition-colors hover:bg-[#2A3150] hover:text-[#F8FAFC]"
          >
            {expanded ? (
              <ChevronUp size={16} strokeWidth={2} />
            ) : (
              <ChevronDown size={16} strokeWidth={2} />
            )}
          </button>
        )}
      </div>

      {/* Expanded: criteria breakdown */}
      {expanded && criteria.length > 0 && (
        <div className="border-t-[0.5px] border-[#2A3150] px-4 pb-4 pt-4">
          <div className="grid grid-cols-2 gap-3">
            {criteria.map((c) => (
              <div key={c.label} className="rounded-lg bg-[#12172B] p-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-[#94A3B8]">
                    {c.label}
                  </span>
                  <span
                    className="text-sm font-bold"
                    style={{ color: bandColor(c.score ?? 0) }}
                  >
                    {c.score ?? "—"}
                  </span>
                </div>
                {/* Mini bar */}
                <div className="mt-2 h-1 w-full rounded-full bg-[#2A3150]">
                  <div
                    className="h-1 rounded-full transition-all duration-700"
                    style={{
                      width: `${((c.score ?? 0) / 9) * 100}%`,
                      backgroundColor: bandColor(c.score ?? 0),
                    }}
                  />
                </div>
                {c.feedback && (
                  <p className="mt-2 text-[11px] leading-relaxed text-[#64748B]">
                    {c.feedback}
                  </p>
                )}
              </div>
            ))}
          </div>

          {overallFeedback && (
            <div className="mt-3 rounded-lg bg-[#12172B] p-3">
              <p className="text-xs font-medium text-[#94A3B8]">
                Examiner Feedback
              </p>
              <p className="mt-1.5 text-xs leading-relaxed text-[#64748B]">
                {overallFeedback}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ── Stats Bar ──────────────────────────────────────────────────── */

function StatsBar({ attempts }: { attempts: Attempt[] }) {
  const total = attempts.length;
  const speaking = attempts.filter((a) => a.sectionType === "speaking");
  const writing = attempts.filter((a) => a.sectionType === "writing");

  const avgBand =
    total > 0
      ? (attempts.reduce((s, a) => s + (a.bandScore || 0), 0) / total).toFixed(
          1
        )
      : "—";

  const bestBand =
    total > 0 ? Math.max(...attempts.map((a) => a.bandScore || 0)) : null;

  const stats = [
    {
      label: "Sessions",
      value: total,
      icon: Zap,
      color: "#6366F1",
      bg: "rgba(99,102,241,0.12)",
    },
    {
      label: "Avg Band",
      value: avgBand,
      icon: BarChart3,
      color: "#F59E0B",
      bg: "rgba(245,158,11,0.12)",
    },
    {
      label: "Best Band",
      value: bestBand ?? "—",
      icon: Trophy,
      color: "#22C55E",
      bg: "rgba(34,197,94,0.12)",
    },
    {
      label: "Speaking",
      value: speaking.length,
      icon: Mic,
      color: "#0EA5E9",
      bg: "rgba(14,165,233,0.12)",
    },
    {
      label: "Writing",
      value: writing.length,
      icon: PenLine,
      color: "#F97316",
      bg: "rgba(249,115,22,0.12)",
    },
  ];

  return (
    <div className="grid grid-cols-5 gap-3">
      {stats.map((s) => {
        const Icon = s.icon;
        return (
          <div
            key={s.label}
            className="flex flex-col items-center rounded-xl border-[0.5px] border-[#2A3150] bg-[#1E2540] p-3"
          >
            <div
              className="flex h-9 w-9 items-center justify-center rounded-[10px]"
              style={{ backgroundColor: s.bg }}
            >
              <Icon size={17} strokeWidth={1.75} style={{ color: s.color }} />
            </div>
            <p
              className="mt-2 text-xl font-bold"
              style={{ color: s.color }}
            >
              {s.value}
            </p>
            <p className="text-[10px] text-[#64748B]">{s.label}</p>
          </div>
        );
      })}
    </div>
  );
}

/* ── Filter Tabs ────────────────────────────────────────────────── */

type Filter = "all" | "speaking" | "writing";

/* ── Main Page ──────────────────────────────────────────────────── */

export default function HistoryPage() {
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>("all");

  useEffect(() => {
    fetch("/api/user/history")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setAttempts(data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered =
    filter === "all"
      ? attempts
      : attempts.filter((a) => a.sectionType === filter);

  /* ── Loading skeleton ─────────────────────────────────────────── */
  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-48 animate-pulse rounded-lg bg-[#1E2540]" />
        <div className="grid grid-cols-5 gap-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-20 animate-pulse rounded-xl bg-[#1E2540]" />
          ))}
        </div>
        <div className="h-48 animate-pulse rounded-xl bg-[#1E2540]" />
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-20 animate-pulse rounded-xl bg-[#1E2540]" />
        ))}
      </div>
    );
  }

  /* ── Empty state ──────────────────────────────────────────────── */
  if (attempts.length === 0) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-5">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[rgba(99,102,241,0.1)]">
          <BookOpen size={36} strokeWidth={1.5} className="text-[#6366F1]" />
        </div>
        <div className="text-center">
          <h2 className="text-xl font-semibold text-[#F8FAFC]">
            No practice sessions yet
          </h2>
          <p className="mt-2 text-sm text-[#64748B]">
            Complete a Speaking or Writing session to see your progress here.
          </p>
        </div>
        <div className="flex gap-3">
          <Link
            href="/dashboard/speaking"
            className="flex items-center gap-2 rounded-xl bg-[#0EA5E9] px-5 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90"
          >
            <Mic size={16} strokeWidth={1.75} />
            Practice Speaking
          </Link>
          <Link
            href="/dashboard/writing"
            className="flex items-center gap-2 rounded-xl bg-[#F97316] px-5 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90"
          >
            <PenLine size={16} strokeWidth={1.75} />
            Practice Writing
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="animate-fade-up flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-[#F8FAFC]">
            Progress History
          </h1>
          <p className="mt-1 text-sm text-[#64748B]">
            {attempts.length} session{attempts.length !== 1 ? "s" : ""} tracked
          </p>
        </div>
        <TrendingUp size={28} strokeWidth={1.5} className="text-[#6366F1]" />
      </div>

      {/* Stats bar */}
      <div className="animate-fade-up animate-fade-up-1">
        <StatsBar attempts={attempts} />
      </div>

      {/* Band score chart */}
      <div className="animate-fade-up animate-fade-up-2 rounded-xl border-[0.5px] border-[#2A3150] bg-[#1E2540] p-5">
        <div className="mb-4 flex items-center gap-2">
          <Target size={16} strokeWidth={1.75} className="text-[#6366F1]" />
          <h2 className="text-[15px] font-semibold text-[#F8FAFC]">
            Band Score Over Time
          </h2>
        </div>
        <BandChart attempts={attempts} />
      </div>

      {/* Filter tabs */}
      <div className="animate-fade-up animate-fade-up-3 flex gap-2">
        {(["all", "speaking", "writing"] as Filter[]).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-full px-4 py-1.5 text-[13px] font-medium transition-all duration-200 ${
              filter === f
                ? "bg-[#6366F1] text-white"
                : "bg-[#1E2540] text-[#94A3B8] hover:text-[#F8FAFC]"
            }`}
          >
            {f === "all" ? "All" : f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {/* Attempt cards */}
      <div className="animate-fade-up animate-fade-up-4 space-y-3">
        {filtered.length === 0 ? (
          <div className="rounded-xl border-[0.5px] border-[#2A3150] bg-[#1E2540] p-8 text-center">
            <p className="text-sm text-[#64748B]">
              No {filter} sessions yet.
            </p>
          </div>
        ) : (
          filtered.map((attempt, i) => (
            <AttemptCard key={attempt._id} attempt={attempt} index={i} />
          ))
        )}
      </div>
    </div>
  );
}

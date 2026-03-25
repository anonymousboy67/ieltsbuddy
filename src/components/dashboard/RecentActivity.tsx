"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Mic, PenLine, TrendingUp, ChevronRight } from "lucide-react";

interface Attempt {
  _id: string;
  sectionType: "speaking" | "writing";
  bandScore: number;
  createdAt: string;
}

function bandColor(band: number): string {
  if (band >= 8) return "#22C55E";
  if (band >= 7) return "#6366F1";
  if (band >= 6) return "#F59E0B";
  return "#EF4444";
}

function formatRelative(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function RecentActivity() {
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/user/history")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setAttempts(data.slice(0, 5));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <section className="mt-8">
        <div className="flex items-center justify-between">
          <h2 className="font-heading text-xl font-semibold text-[#F8FAFC]">
            Recent Activity
          </h2>
        </div>
        <div className="mt-4 space-y-2">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="h-14 animate-pulse rounded-xl bg-[#1E2540]"
            />
          ))}
        </div>
      </section>
    );
  }

  if (attempts.length === 0) return null;

  return (
    <section className="mt-8">
      <div className="flex items-center justify-between">
        <h2 className="font-heading text-xl font-semibold text-[#F8FAFC]">
          Recent Activity
        </h2>
        <Link
          href="/dashboard/history"
          className="flex items-center gap-1 text-sm text-[#6366F1] transition-colors hover:text-[#818CF8]"
        >
          View all
          <ChevronRight size={14} strokeWidth={2} />
        </Link>
      </div>

      <div className="mt-4 space-y-2">
        {attempts.map((a, i) => {
          const color = bandColor(a.bandScore);
          const isSpeaking = a.sectionType === "speaking";
          return (
            <Link
              key={a._id}
              href="/dashboard/history"
              className={`animate-fade-up flex items-center gap-3 rounded-xl border-[0.5px] border-[#2A3150] bg-[#1E2540] px-4 py-3 transition-all duration-200 hover:border-[rgba(99,102,241,0.3)] hover:bg-[#232948]`}
              style={{ animationDelay: `${i * 50}ms` }}
            >
              <div
                className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg"
                style={{
                  backgroundColor: isSpeaking
                    ? "rgba(14,165,233,0.15)"
                    : "rgba(249,115,22,0.15)",
                }}
              >
                {isSpeaking ? (
                  <Mic size={15} strokeWidth={1.75} style={{ color: "#0EA5E9" }} />
                ) : (
                  <PenLine size={15} strokeWidth={1.75} style={{ color: "#F97316" }} />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-medium text-[#F8FAFC]">
                  {isSpeaking ? "Speaking" : "Writing"} Practice
                </p>
                <p className="text-[11px] text-[#64748B]">
                  {formatRelative(a.createdAt)}
                </p>
              </div>

              <div className="flex items-center gap-1.5">
                <TrendingUp size={12} strokeWidth={2} style={{ color }} />
                <span
                  className="text-sm font-bold"
                  style={{ color }}
                >
                  Band {a.bandScore}
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

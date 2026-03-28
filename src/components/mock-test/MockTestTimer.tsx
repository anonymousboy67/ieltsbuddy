"use client";

import { useEffect, useState } from "react";
import { Clock } from "lucide-react";

interface MockTestTimerProps {
  totalSeconds: number;
  onTimeUp: () => void;
  sectionName: string;
}

export default function MockTestTimer({ totalSeconds, onTimeUp, sectionName }: MockTestTimerProps) {
  const [timeLeft, setTimeLeft] = useState(totalSeconds);

  // Reset when section changes
  useEffect(() => {
    setTimeLeft(totalSeconds);
  }, [totalSeconds, sectionName]);

  useEffect(() => {
    if (timeLeft <= 0) {
      onTimeUp();
      return;
    }
    const t = setInterval(() => setTimeLeft((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(t);
  }, [timeLeft, onTimeUp]);

  const formatTime = (s: number) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60).toString().padStart(2, "0");
    const sec = (s % 60).toString().padStart(2, "0");
    return h > 0 ? `${h}:${m}:${sec}` : `${m}:${sec}`;
  };

  const isUrgent = timeLeft < 5 * 60; // < 5 minutes
  const isCritical = timeLeft < 60;   // < 1 minute
  const pct = (timeLeft / totalSeconds) * 100;

  return (
    <div
      className={`flex items-center gap-3 rounded-xl border-[0.5px] px-4 py-2.5 transition-all ${
        isCritical
          ? "border-[rgba(239,68,68,0.5)] bg-[rgba(239,68,68,0.08)]"
          : isUrgent
            ? "border-[rgba(249,115,22,0.4)] bg-[rgba(249,115,22,0.06)]"
            : "border-[#2A3150] bg-[#1E2540]"
      }`}
    >
      <Clock
        size={16}
        strokeWidth={1.75}
        className={isCritical ? "text-[#EF4444] animate-pulse" : isUrgent ? "text-[#F59E0B]" : "text-[#94A3B8]"}
      />

      {/* Progress bar */}
      <div className="flex-1 h-1.5 rounded-full bg-[#0B0F1A] overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-1000 ${
            isCritical ? "bg-[#EF4444]" : isUrgent ? "bg-[#F59E0B]" : "bg-[#6366F1]"
          }`}
          style={{ width: `${pct}%` }}
        />
      </div>

      <span
        className={`font-mono text-sm font-bold tabular-nums ${
          isCritical ? "text-[#EF4444] animate-pulse" : isUrgent ? "text-[#F59E0B]" : "text-[#F8FAFC]"
        }`}
      >
        {formatTime(timeLeft)}
      </span>
    </div>
  );
}

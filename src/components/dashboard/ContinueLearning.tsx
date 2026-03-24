"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Mic, PenLine, BookOpen, Headphones, ChevronRight } from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface ContentCounts {
  writing: number;
  reading: number;
  speaking: number;
  firstWritingId: string | null;
  firstReadingId: string | null;
}

interface LearningItem {
  skill: string;
  title: string;
  progress: string;
  total: number;
  icon: LucideIcon;
  color: string;
  bg: string;
  href: string;
}

const staggerClass = [
  "animate-fade-up-6",
  "animate-fade-up-7",
  "animate-fade-up-8",
  "animate-fade-up-9",
];

export default function ContinueLearning() {
  const [counts, setCounts] = useState<ContentCounts>({
    writing: 0,
    reading: 0,
    speaking: 0,
    firstWritingId: null,
    firstReadingId: null,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchCounts() {
      try {
        const [wRes, rRes, sRes] = await Promise.all([
          fetch("/api/content/writing"),
          fetch("/api/content/reading"),
          fetch("/api/content/speaking"),
        ]);

        const writing = wRes.ok ? await wRes.json() : [];
        const reading = rRes.ok ? await rRes.json() : [];
        const speaking = sRes.ok ? await sRes.json() : [];

        setCounts({
          writing: Array.isArray(writing) ? writing.length : 0,
          reading: Array.isArray(reading) ? reading.length : 0,
          speaking: Array.isArray(speaking) ? speaking.length : 0,
          firstWritingId: Array.isArray(writing) && writing.length > 0 ? writing[0]._id : null,
          firstReadingId: Array.isArray(reading) && reading.length > 0 ? reading[0]._id : null,
        });
      } catch {
        // empty
      } finally {
        setLoading(false);
      }
    }
    fetchCounts();
  }, []);

  const items: LearningItem[] = [
    {
      skill: "Listening",
      title: "Coming Soon",
      progress: "0 tests available",
      total: 0,
      icon: Headphones,
      color: "#047857",
      bg: "rgba(4,120,87,0.15)",
      href: "/dashboard/listening",
    },
    {
      skill: "Reading",
      title: "Reading Practice",
      progress: `${counts.reading} passages available`,
      total: counts.reading,
      icon: BookOpen,
      color: "#B45309",
      bg: "rgba(180,83,9,0.15)",
      href: counts.firstReadingId
        ? `/dashboard/reading/passage/${counts.firstReadingId}`
        : "/dashboard/reading",
    },
    {
      skill: "Writing",
      title: "Writing Lab",
      progress: `${counts.writing} tasks available`,
      total: counts.writing,
      icon: PenLine,
      color: "#C2410C",
      bg: "rgba(194,65,12,0.15)",
      href: counts.firstWritingId
        ? `/dashboard/writing/task/${counts.firstWritingId}`
        : "/dashboard/writing",
    },
    {
      skill: "Speaking",
      title: "Speaking Practice",
      progress: `${counts.speaking} question sets available`,
      total: counts.speaking,
      icon: Mic,
      color: "#0F766E",
      bg: "rgba(15,118,110,0.15)",
      href: "/dashboard/speaking",
    },
  ];

  if (loading) {
    return (
      <section className="mt-8">
        <h2 className="font-heading text-xl font-semibold text-[#292524]">
          Continue Learning
        </h2>
        <div className="mt-4 flex flex-col gap-3">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className="flex items-center gap-4 rounded-xl border-[0.5px] border-[#E7E5E4] bg-[#FDF8F2] p-4"
            >
              <div className="h-10 w-10 animate-pulse rounded-[10px] bg-[#E7E5E4]" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-24 animate-pulse rounded bg-[#E7E5E4]" />
                <div className="h-3 w-40 animate-pulse rounded bg-[#E7E5E4]" />
                <div className="h-1 w-full animate-pulse rounded bg-[#E7E5E4]" />
              </div>
            </div>
          ))}
        </div>
      </section>
    );
  }

  return (
    <section className="mt-8">
      <h2 className="font-heading text-xl font-semibold text-[#292524]">
        Continue Learning
      </h2>
      <div className="mt-4 flex flex-col gap-3">
        {items.map((item, i) => {
          const Icon = item.icon;

          return (
            <Link
              key={i}
              href={item.href}
              className={`animate-fade-up ${staggerClass[i]} group flex cursor-pointer items-center gap-4 rounded-xl border-[0.5px] border-[#E7E5E4] bg-[#FDF8F2] p-4 transition-all duration-200 ease-out hover:-translate-y-0.5 hover:border-[rgba(4,120,87,0.28)] hover:bg-stone-100`}
            >
              <div
                className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-[10px]"
                style={{ backgroundColor: item.bg }}
              >
                <Icon size={20} strokeWidth={1.75} style={{ color: item.color }} />
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span
                    className="rounded-full px-2.5 py-0.5 text-[11px] font-medium text-white"
                    style={{ backgroundColor: item.color }}
                  >
                    {item.skill}
                  </span>
                </div>
                <p className="mt-1.5 truncate text-[15px] font-medium text-[#292524]">
                  {item.title}
                </p>
                <p className="mt-1 text-xs text-[#78716C]">{item.progress}</p>
              </div>

              <ChevronRight
                size={20}
                strokeWidth={1.75}
                className="flex-shrink-0 text-[#78716C] transition-transform duration-200 group-hover:translate-x-0.5"
              />
            </Link>
          );
        })}
      </div>
    </section>
  );
}

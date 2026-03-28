"use client";

import { useEffect, useState, useCallback, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Headphones,
  BookOpen,
  PenLine,
  CheckCircle,
  AlertTriangle,
  Trophy,
  ChevronRight,
  Lock,
} from "lucide-react";
import MockTestTimer from "@/components/mock-test/MockTestTimer";
import MockReadingWrapper, { PassageData } from "@/components/mock-test/MockReadingWrapper";
import MockListeningWrapper, { ListeningPart } from "@/components/mock-test/MockListeningWrapper";

/* ── Types ─────────────────────────────────────────────────── */
type SectionKey = "listening" | "reading" | "writing";
type SectionStatus = "pending" | "active" | "completed" | "skipped";

interface SectionState {
  key: SectionKey;
  label: string;
  icon: typeof Headphones;
  color: string;
  durationMinutes: number;
  status: SectionStatus;
}

const SECTION_DEFS: {
  key: SectionKey;
  label: string;
  icon: typeof Headphones;
  color: string;
  durationMinutes: number;
}[] = [
  { key: "listening", label: "Listening", icon: Headphones, color: "#22C55E", durationMinutes: 30 },
  { key: "reading", label: "Reading", icon: BookOpen, color: "#A855F7", durationMinutes: 60 },
  { key: "writing", label: "Writing", icon: PenLine, color: "#F59E0B", durationMinutes: 60 },
];

/* ── Component ─────────────────────────────────────────────── */
export default function MockTestExamPage({ params }: { params: Promise<{ testId: string }> }) {
  const { testId } = use(params);
  const router = useRouter();

  const [testInfo, setTestInfo] = useState<{
    bookNumber: number;
    testNumber: number;
    hasListening: boolean;
    hasReading: boolean;
    hasWriting: boolean;
  } | null>(null);

  const [sections, setSections] = useState<SectionState[]>([]);
  const [currentSectionIdx, setCurrentSectionIdx] = useState(0);
  const [started, setStarted] = useState(false);
  const [showConfirmEnd, setShowConfirmEnd] = useState(false);
  const [answers, setAnswers] = useState<Record<SectionKey, Record<number, string>>>({
    listening: {},
    reading: {},
    writing: {},
  });
  const [writingText, setWritingText] = useState("");
  const [listeningParts, setListeningParts] = useState<ListeningPart[]>([]);
  const [readingPassages, setReadingPassages] = useState<PassageData[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const handleAnswer = useCallback((section: SectionKey, qNum: number, value: string) => {
    setAnswers((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [qNum]: value,
      },
    }));
  }, []);

  // Load test info
  useEffect(() => {
    fetch("/api/mock-test/tests")
      .then((r) => r.json())
      .then((tests: { bookNumber: number; testNumber: number; hasListening: boolean; hasReading: boolean; hasWriting: boolean }[]) => {
        const [book, test] = testId.split("-").map(Number);
        const found = tests.find((t) => t.bookNumber === book && t.testNumber === test);
        if (!found) { router.push("/dashboard/mock-test"); return; }

        setTestInfo(found);

        // Fetch actual test data if present
        if (found.hasListening) {
          fetch(`/api/listening/${book}/${test}`)
            .then((r) => r.json())
            .then((data) => setListeningParts(Array.isArray(data) ? data : []))
            .catch(() => {});
        }
        if (found.hasReading) {
          fetch(`/api/reading/${book}/${test}`)
            .then((r) => r.json())
            .then((data) => setReadingPassages(Array.isArray(data) ? data : []))
            .catch(() => {});
        }

        // Build only sections that exist for this test
        const available = SECTION_DEFS.filter((s) => {
          if (s.key === "listening") return found.hasListening;
          if (s.key === "reading") return found.hasReading;
          if (s.key === "writing") return found.hasWriting;
          return false;
        });

        setSections(
          available.map((s, i) => ({
            ...s,
            status: i === 0 ? "active" : "pending",
          }))
        );
      })
      .catch(() => router.push("/dashboard/mock-test"));
  }, [testId, router]);

  const currentSection = sections[currentSectionIdx];

  // When timer runs out — auto-advance
  const handleTimeUp = useCallback(() => {
    advanceSection();
  }, [currentSectionIdx, sections]); // eslint-disable-line

  const advanceSection = useCallback(() => {
    setSections((prev) => {
      const updated = [...prev];
      if (updated[currentSectionIdx]) {
        updated[currentSectionIdx] = { ...updated[currentSectionIdx], status: "completed" };
      }
      if (currentSectionIdx + 1 < updated.length) {
        updated[currentSectionIdx + 1] = { ...updated[currentSectionIdx + 1], status: "active" };
      }
      return updated;
    });

    if (currentSectionIdx + 1 >= sections.length) {
      finishExam();
    } else {
      setCurrentSectionIdx((i) => i + 1);
    }
  }, [currentSectionIdx, sections.length]);

  const finishExam = async () => {
    setSubmitting(true);
    try {
      const payload = {
        bookNumber: testInfo?.bookNumber,
        testNumber: testInfo?.testNumber,
        answers: {
          listening: answers.listening,
          reading: answers.reading,
        },
        writingText: writingText,
      };

      const res = await fetch("/api/mock-test/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        setDone(true);
      } else {
        console.error("Failed to submit test");
      }
    } catch (error) {
      console.error("Submission error:", error);
    } finally {
      setSubmitting(false);
    }
  };

  // Warn before leaving
  useEffect(() => {
    if (!started || done) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "Your mock test progress will be lost!";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [started, done]);

  /* ── Pre-start screen */
  if (!started && testInfo) {
    return (
      <div className="flex flex-col gap-6">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/mock-test"
            className="flex h-10 w-10 items-center justify-center rounded-full border-[0.5px] border-[#2A3150] bg-[#1E2540] transition-all hover:border-[rgba(99,102,241,0.3)]"
          >
            <ArrowLeft size={20} strokeWidth={1.75} className="text-[#94A3B8]" />
          </Link>
          <div>
            <h1 className="text-base font-semibold text-[#F8FAFC]">
              Book {testInfo.bookNumber} · Test {testInfo.testNumber}
            </h1>
            <p className="text-xs text-[#64748B]">Full mock exam</p>
          </div>
        </div>

        {/* Warning card */}
        <div className="rounded-xl border-[0.5px] border-[rgba(249,115,22,0.3)] bg-[rgba(249,115,22,0.06)] p-5">
          <div className="flex items-start gap-3">
            <AlertTriangle size={18} className="text-[#F59E0B] flex-shrink-0 mt-0.5" strokeWidth={1.75} />
            <div>
              <p className="text-sm font-medium text-[#F8FAFC]">Before you start</p>
              <ul className="mt-2 space-y-1.5 text-sm text-[#94A3B8]">
                <li>• Sections are <strong className="text-white">locked in order</strong> — you cannot go back</li>
                <li>• The timer <strong className="text-white">cannot be paused</strong> once started</li>
                <li>• Answers are <strong className="text-white">auto-submitted</strong> when time runs out</li>
                <li>• Do not close or refresh the browser tab</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Section overview */}
        <div className="rounded-xl border-[0.5px] border-[#2A3150] bg-[#1E2540] p-4">
          <p className="mb-3 text-xs font-medium uppercase tracking-wider text-[#64748B]">Sections</p>
          <div className="space-y-3">
            {sections.map((s, i) => {
              const Icon = s.icon;
              return (
                <div key={s.key} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className="flex h-8 w-8 items-center justify-center rounded-lg"
                      style={{ backgroundColor: `${s.color}18` }}
                    >
                      <Icon size={16} strokeWidth={1.75} style={{ color: s.color }} />
                    </div>
                    <span className="text-sm text-[#F8FAFC]">{s.label}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-[#64748B]">{s.durationMinutes} min</span>
                    {i > 0 && <Lock size={12} className="text-[#4A5568]" />}
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-4 border-t border-[#2A3150] pt-3 flex justify-between">
            <span className="text-xs text-[#64748B]">Total time</span>
            <span className="text-xs font-medium text-[#F8FAFC]">
              {sections.reduce((sum, s) => sum + s.durationMinutes, 0)} minutes
            </span>
          </div>
        </div>

        <button
          onClick={() => setStarted(true)}
          className="w-full rounded-xl bg-gradient-to-r from-[#6366F1] to-[#4F46E5] py-4 text-[15px] font-medium text-white shadow-lg shadow-[rgba(99,102,241,0.25)] transition-all hover:scale-[1.01]"
        >
          Start Mock Test →
        </button>
      </div>
    );
  }

  /* ── Completion screen */
  if (done) {
    return (
      <div className="flex flex-col items-center gap-6 text-center py-8">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-[#6366F1] to-[#4F46E5] shadow-[0_0_40px_rgba(99,102,241,0.3)]">
          <Trophy size={36} strokeWidth={1.5} className="text-white" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-[#F8FAFC]">Test Complete!</h2>
          <p className="mt-2 text-sm text-[#94A3B8]">
            Great work finishing the mock exam. Writing is being evaluated by AI.
          </p>
        </div>
        <div className="w-full rounded-xl border-[0.5px] border-[#2A3150] bg-[#1E2540] p-4 text-left">
          <p className="text-xs font-medium uppercase tracking-wider text-[#64748B] mb-3">Section Summary</p>
          {sections.map((s) => {
            const Icon = s.icon;
            return (
              <div key={s.key} className="flex items-center justify-between py-2 border-b border-[#2A3150] last:border-0">
                <div className="flex items-center gap-2">
                  <Icon size={14} strokeWidth={1.75} style={{ color: s.color }} />
                  <span className="text-sm text-[#F8FAFC]">{s.label}</span>
                </div>
                <CheckCircle size={16} className="text-[#22C55E]" strokeWidth={1.75} />
              </div>
            );
          })}
        </div>
        <Link
          href="/dashboard/history"
          className="w-full rounded-xl bg-gradient-to-r from-[#6366F1] to-[#4F46E5] py-3.5 text-[15px] font-medium text-white text-center transition-all hover:scale-[1.01]"
        >
          View My Results
        </Link>
        <Link
          href="/dashboard/mock-test"
          className="text-sm text-[#64748B] hover:text-[#94A3B8]"
        >
          Back to Mock Tests
        </Link>
      </div>
    );
  }

  /* ── Exam screen */
  if (!currentSection || !started) return null;

  const Icon = currentSection.icon;

  return (
    <div className="flex flex-col gap-4">
      {/* Header with timer */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="flex h-9 w-9 items-center justify-center rounded-lg"
              style={{ backgroundColor: `${currentSection.color}18` }}
            >
              <Icon size={18} strokeWidth={1.75} style={{ color: currentSection.color }} />
            </div>
            <div>
              <p className="text-sm font-semibold text-[#F8FAFC]">{currentSection.label}</p>
              <p className="text-xs text-[#64748B]">
                Section {currentSectionIdx + 1} of {sections.length}
              </p>
            </div>
          </div>

          {/* Section pills */}
          <div className="flex gap-1.5">
            {sections.map((s, i) => {
              const S = s.icon;
              return (
                <div
                  key={s.key}
                  className={`flex h-7 w-7 items-center justify-center rounded-full transition-all ${
                    i === currentSectionIdx
                      ? "bg-[#6366F1]"
                      : s.status === "completed"
                        ? "bg-[rgba(34,197,94,0.18)]"
                        : "bg-[#1E2540]"
                  }`}
                  title={s.label}
                >
                  {s.status === "completed" ? (
                    <CheckCircle size={12} className="text-[#22C55E]" />
                  ) : i === currentSectionIdx ? (
                    <S size={12} className="text-white" />
                  ) : (
                    <Lock size={11} className="text-[#4A5568]" />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <MockTestTimer
          key={currentSection.key}
          totalSeconds={currentSection.durationMinutes * 60}
          sectionName={currentSection.key}
          onTimeUp={handleTimeUp}
        />
      </div>

      {/* Content area */}
      <div className={`rounded-xl border-[0.5px] border-[#2A3150] bg-[#1E2540] ${currentSection.key === "writing" ? "p-5" : "p-3"} min-h-[600px]`}>
        {currentSection.key === "writing" ? (
          <div className="flex flex-col gap-3">
            <p className="text-xs font-medium uppercase tracking-wider text-[#64748B]">Writing Task</p>
            <p className="text-sm text-[#94A3B8]">
              Write at least 150 words for Task 1 and 250 words for Task 2. Use formal academic language.
            </p>
            <textarea
              value={writingText}
              onChange={(e) => setWritingText(e.target.value)}
              placeholder="Begin your response here..."
              className="min-h-[35vh] w-full resize-none rounded-lg border-[0.5px] border-[#2A3150] bg-[#12172B] p-4 text-sm text-[#F8FAFC] placeholder-[#4A5568] outline-none focus:border-[#6366F1]"
            />
            <div className="flex justify-between text-xs text-[#64748B]">
              <span>{writingText.trim().split(/\s+/).filter(Boolean).length} words</span>
              <span>Min. 250 words recommended</span>
            </div>
          </div>
        ) : currentSection.key === "reading" ? (
          <MockReadingWrapper passages={readingPassages} answers={answers.reading} onAnswer={(q, v) => handleAnswer("reading", q, v)} />
        ) : currentSection.key === "listening" ? (
          <MockListeningWrapper parts={listeningParts} answers={answers.listening} onAnswer={(q, v) => handleAnswer("listening", q, v)} />
        ) : null}
      </div>

      {/* Bottom controls */}
      <div className="flex gap-3">
        <button
          onClick={() => setShowConfirmEnd(true)}
          className="flex-1 rounded-xl border-[0.5px] border-[#2A3150] py-3 text-sm text-[#64748B] transition-all hover:border-[rgba(239,68,68,0.4)] hover:text-[#EF4444]"
        >
          End Test
        </button>
        <button
          onClick={advanceSection}
          disabled={submitting}
          className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#6366F1] py-3 text-sm font-medium text-white transition-all hover:bg-[#818CF8]"
        >
          {currentSectionIdx + 1 >= sections.length ? "Submit Test" : "Next Section"}
          <ChevronRight size={16} strokeWidth={2} />
        </button>
      </div>

      {/* Confirm end dialog */}
      {showConfirmEnd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="mx-4 w-full max-w-sm rounded-2xl border-[0.5px] border-[#2A3150] bg-[#12172B] p-6">
            <h3 className="text-lg font-semibold text-[#F8FAFC]">End test early?</h3>
            <p className="mt-2 text-sm text-[#94A3B8]">
              Your progress for incomplete sections will not be saved.
            </p>
            <div className="mt-4 flex gap-3">
              <button
                onClick={() => setShowConfirmEnd(false)}
                className="flex-1 rounded-xl border-[0.5px] border-[#2A3150] py-3 text-sm text-[#94A3B8] hover:border-[#6366F1]"
              >
                Cancel
              </button>
              <button
                onClick={() => { setShowConfirmEnd(false); finishExam(); }}
                className="flex-1 rounded-xl bg-[#EF4444] py-3 text-sm font-medium text-white hover:bg-[#DC2626]"
              >
                End Test
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

"use client";

import { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Clock,
  BookOpen,
  FileText,
  CheckCircle,
  XCircle,
  Tag,
} from "lucide-react";

interface Question {
  questionNumber: number;
  questionType: string;
  questionText: string;
  options?: string[];
  correctAnswer: string;
}

interface PassageData {
  _id: string;
  bookNumber: number;
  testNumber: number;
  partNumber?: number;
  title?: string;
  topic?: string;
  difficulty?: string;
  passage?: string;
  questions?: Question[];
  content?: string;
}

type Answers = Record<number, string>;

const BAND_MAP: Record<number, number> = {
  13: 9, 12: 8.5, 11: 8, 10: 7.5, 9: 7, 8: 6.5, 7: 6, 6: 5.5,
  5: 5, 4: 4.5, 3: 4, 2: 3.5, 1: 3, 0: 2,
};

function getBand(correct: number, total: number): number {
  if (total === 0) return 0;
  if (total === 13) return BAND_MAP[correct] ?? 2;
  const scaled = Math.round((correct / total) * 13);
  return BAND_MAP[Math.min(scaled, 13)] ?? 2;
}

function formatTime(s: number): string {
  const m = Math.floor(s / 60).toString().padStart(2, "0");
  const sec = (s % 60).toString().padStart(2, "0");
  return `${m}:${sec}`;
}

// --------------- Markdown Renderer ---------------

function renderMarkdown(md: string): string {
  let html = md
    // Headings
    .replace(/^#### (.+)$/gm, '<h4 class="text-base font-semibold text-[#F8FAFC] mt-4 mb-2">$1</h4>')
    .replace(/^### (.+)$/gm, '<h3 class="text-lg font-semibold text-[#F8FAFC] mt-5 mb-2">$1</h3>')
    .replace(/^## (.+)$/gm, '<h2 class="text-xl font-bold text-[#F8FAFC] mt-6 mb-3">$1</h2>')
    .replace(/^# (.+)$/gm, '<h1 class="text-2xl font-bold text-[#F8FAFC] mt-6 mb-3">$1</h1>')
    // Bold and italic
    .replace(/\*\*\*(.+?)\*\*\*/g, "<strong><em>$1</em></strong>")
    .replace(/\*\*(.+?)\*\*/g, '<strong class="text-[#F8FAFC]">$1</strong>')
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    // Line breaks to paragraphs
    .replace(/\n\n+/g, '</p><p class="mb-4">')
    .replace(/\n/g, "<br/>");

  html = `<p class="mb-4">${html}</p>`;

  // Clean empty paragraphs
  html = html.replace(/<p class="mb-4"><\/p>/g, "");

  return html;
}

// --------------- Parse questions from markdown content ---------------

interface ParsedQuestion {
  questionNumber: number;
  questionText: string;
  questionType: string;
}

function parseQuestionsFromContent(content: string): ParsedQuestion[] {
  const questions: ParsedQuestion[] = [];
  // Match patterns like "1 ...", "1. ...", "Question 1 ..."
  const lines = content.split("\n");
  let inQSection = false;

  for (const line of lines) {
    const trimmed = line.trim();

    // Detect question sections
    if (/questions?\s+\d/i.test(trimmed) || /^#{1,4}\s*questions?/i.test(trimmed)) {
      inQSection = true;
      continue;
    }

    if (inQSection) {
      // Match numbered questions: "1 text", "1. text", "27 text"
      const qMatch = trimmed.match(/^(\d{1,2})\s*[.)]\s*(.+)/);
      if (qMatch) {
        questions.push({
          questionNumber: parseInt(qMatch[1]),
          questionText: qMatch[2].replace(/\*\*/g, "").trim(),
          questionType: "short-answer",
        });
      }
    }
  }

  // If we didn't find questions in a section, try globally
  if (questions.length === 0) {
    for (const line of lines) {
      const qMatch = line.trim().match(/^(\d{1,2})\s*[.)]\s+(.{10,})/);
      if (qMatch) {
        const num = parseInt(qMatch[1]);
        if (num >= 1 && num <= 40) {
          questions.push({
            questionNumber: num,
            questionText: qMatch[2].replace(/\*\*/g, "").trim(),
            questionType: "short-answer",
          });
        }
      }
    }
  }

  return questions;
}

function extractPassageFromContent(content: string): string {
  // Try to split out just the passage text before questions
  const qStart = content.search(/questions?\s+\d/i);
  if (qStart > 200) {
    return content.substring(0, qStart).trim();
  }
  return content;
}

// --------------- Question Renderers ---------------

function RadioOption({
  label,
  selected,
  name,
  onChange,
}: {
  label: string;
  selected: boolean;
  name: string;
  onChange: () => void;
}) {
  return (
    <label
      className={`flex cursor-pointer items-center gap-3 rounded-lg border-[0.5px] px-4 py-2.5 transition-all duration-150 ${
        selected
          ? "border-[#6366F1] bg-[rgba(99,102,241,0.1)]"
          : "border-[#2A3150] bg-[#1E2540] hover:border-[rgba(99,102,241,0.3)]"
      }`}
    >
      <input
        type="radio"
        name={name}
        checked={selected}
        onChange={onChange}
        className="sr-only"
      />
      <span
        className={`flex h-4 w-4 items-center justify-center rounded-full border-[1.5px] ${
          selected ? "border-[#6366F1]" : "border-[#64748B]"
        }`}
      >
        {selected && <span className="h-2 w-2 rounded-full bg-[#6366F1]" />}
      </span>
      <span className={`text-sm ${selected ? "text-[#F8FAFC]" : "text-[#94A3B8]"}`}>
        {label}
      </span>
    </label>
  );
}

function renderStructuredQuestion(
  q: Question,
  answer: string,
  onChange: (v: string) => void
) {
  const t = q.questionType.toLowerCase().replace(/[\s_]/g, "-");
  const name = `q-${q.questionNumber}`;

  if (t.includes("true-false") || t.includes("tfng")) {
    return (
      <div className="space-y-2">
        {["True", "False", "Not Given"].map((o) => (
          <RadioOption key={o} label={o} selected={answer === o} name={name} onChange={() => onChange(o)} />
        ))}
      </div>
    );
  }

  if (t.includes("yes-no") || t.includes("ynngt")) {
    return (
      <div className="space-y-2">
        {["Yes", "No", "Not Given"].map((o) => (
          <RadioOption key={o} label={o} selected={answer === o} name={name} onChange={() => onChange(o)} />
        ))}
      </div>
    );
  }

  if (t.includes("multiple-choice")) {
    const options = q.options?.length ? q.options : ["A", "B", "C", "D"];
    return (
      <div className="space-y-2">
        {options.map((o, i) => {
          const letter = String.fromCharCode(65 + i);
          return (
            <label
              key={i}
              className={`flex cursor-pointer items-center gap-3 rounded-lg border-[0.5px] px-4 py-2.5 transition-all duration-150 ${
                answer === letter
                  ? "border-[#6366F1] bg-[rgba(99,102,241,0.1)]"
                  : "border-[#2A3150] bg-[#1E2540] hover:border-[rgba(99,102,241,0.3)]"
              }`}
            >
              <input type="radio" name={name} checked={answer === letter} onChange={() => onChange(letter)} className="sr-only" />
              <span
                className={`flex h-5 w-5 items-center justify-center rounded-full text-xs font-medium ${
                  answer === letter ? "bg-[#6366F1] text-white" : "bg-[#2A3150] text-[#94A3B8]"
                }`}
              >
                {letter}
              </span>
              <span className={`text-sm ${answer === letter ? "text-[#F8FAFC]" : "text-[#94A3B8]"}`}>{o}</span>
            </label>
          );
        })}
      </div>
    );
  }

  if (t.includes("matching")) {
    const options = q.options?.length ? q.options : ["A", "B", "C", "D", "E", "F", "G"];
    return (
      <select
        value={answer}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border-[0.5px] border-[#2A3150] bg-[#12172B] px-3 py-2.5 text-sm text-[#F8FAFC] outline-none transition-colors focus:border-[#6366F1]"
      >
        <option value="">Select an answer...</option>
        {options.map((o, i) => (
          <option key={i} value={o}>{o}</option>
        ))}
      </select>
    );
  }

  // Default: text input for sentence-completion, short-answer, summary-completion
  return (
    <input
      type="text"
      value={answer}
      onChange={(e) => onChange(e.target.value)}
      placeholder="Type your answer..."
      className="w-full rounded-lg border-[0.5px] border-[#2A3150] bg-[#12172B] px-3 py-2.5 text-sm text-[#F8FAFC] outline-none transition-colors placeholder:text-[#64748B] focus:border-[#6366F1]"
    />
  );
}

// --------------- Score Gauge ---------------

function ScoreGauge({ correct, total }: { correct: number; total: number }) {
  const [animated, setAnimated] = useState(0);
  const band = getBand(correct, total);
  const pct = total > 0 ? correct / total : 0;
  const radius = 60;
  const circ = 2 * Math.PI * radius;
  const offset = circ - pct * circ;

  useEffect(() => {
    const dur = 1000;
    const start = performance.now();
    function tick(now: number) {
      const t = Math.min((now - start) / dur, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      setAnimated(Math.round(eased * correct));
      if (t < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }, [correct]);

  const color = pct >= 0.7 ? "#22C55E" : pct >= 0.5 ? "#F59E0B" : "#EF4444";

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative flex items-center justify-center">
        <svg width="150" height="150" className="-rotate-90">
          <circle cx="75" cy="75" r={radius} fill="none" stroke="#1E2540" strokeWidth="8" />
          <circle
            cx="75" cy="75" r={radius} fill="none" stroke={color} strokeWidth="8"
            strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={offset}
            className="animate-gauge-ring"
            style={{ "--gauge-circumference": circ, "--gauge-target": offset } as React.CSSProperties}
          />
        </svg>
        <div className="absolute flex flex-col items-center">
          <span className="text-3xl font-bold" style={{ color }}>
            {animated}/{total}
          </span>
          <span className="text-xs text-[#64748B]">Correct</span>
        </div>
      </div>
      <p className="text-sm text-[#94A3B8]">
        Estimated Band: <span className="font-bold text-[#F8FAFC]">{band}</span>
      </p>
    </div>
  );
}

// --------------- Main Component ---------------

export default function ReadingTestPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [passage, setPassage] = useState<PassageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [answers, setAnswers] = useState<Answers>({});
  const [submitted, setSubmitted] = useState(false);
  const [timeLeft, setTimeLeft] = useState(20 * 60);
  const [mobileTab, setMobileTab] = useState<"passage" | "questions">("passage");
  const [showLeaveDialog, setShowLeaveDialog] = useState(false);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Fetch passage
  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/content/reading/${id}`);
        if (res.ok) setPassage(await res.json());
      } catch {
        // empty
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  // Determine questions source
  const hasStructuredQuestions = (passage?.questions?.length ?? 0) > 0;
  const parsedFromContent = useMemo(() => {
    if (hasStructuredQuestions || !passage?.content) return [];
    return parseQuestionsFromContent(passage.content);
  }, [hasStructuredQuestions, passage?.content]);

  const effectiveQuestions: Array<{
    questionNumber: number;
    questionText: string;
    questionType: string;
    options?: string[];
    correctAnswer: string;
  }> = useMemo(() => {
    if (hasStructuredQuestions) return passage!.questions!;
    return parsedFromContent.map((q) => ({
      ...q,
      options: [],
      correctAnswer: "",
    }));
  }, [hasStructuredQuestions, passage, parsedFromContent]);

  const totalQuestions = effectiveQuestions.length;

  // Passage text source
  const passageText = useMemo(() => {
    if (passage?.passage) return passage.passage;
    if (passage?.content) return extractPassageFromContent(passage.content);
    return "";
  }, [passage]);

  const hasContent = !!passage?.content;

  // Timer
  useEffect(() => {
    if (submitted) return;
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [submitted]);

  const handleSubmit = useCallback(() => {
    setSubmitted(true);
    if (timerRef.current) clearInterval(timerRef.current);
  }, []);

  useEffect(() => {
    if (timeLeft === 0 && !submitted) handleSubmit();
  }, [timeLeft, submitted, handleSubmit]);

  const setAnswer = useCallback((qNum: number, value: string) => {
    setAnswers((prev) => ({ ...prev, [qNum]: value }));
  }, []);

  const answeredCount = Object.values(answers).filter((v) => v.trim() !== "").length;

  // Grading
  const results = submitted
    ? effectiveQuestions.map((q) => {
        const studentAns = (answers[q.questionNumber] || "").trim().toLowerCase();
        const correct = q.correctAnswer.trim().toLowerCase();
        const isCorrect = correct !== "" && studentAns === correct;
        return {
          ...q,
          studentAnswer: answers[q.questionNumber] || "",
          isCorrect,
          hasAnswer: correct !== "",
        };
      })
    : [];
  const gradableResults = results.filter((r) => r.hasAnswer);
  const correctCount = gradableResults.filter((r) => r.isCorrect).length;
  const gradableTotal = gradableResults.length;

  function handleBack() {
    if (!submitted && answeredCount > 0) {
      setShowLeaveDialog(true);
    } else {
      router.push("/dashboard/reading");
    }
  }

  // Loading
  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 animate-pulse rounded-full bg-[#1E2540]" />
          <div className="h-5 w-48 animate-pulse rounded bg-[#1E2540]" />
        </div>
        <div className="h-96 animate-pulse rounded-xl bg-[#1E2540]" />
      </div>
    );
  }

  if (!passage) {
    return (
      <div className="flex min-h-[300px] flex-col items-center justify-center gap-4">
        <p className="text-[15px] text-[#94A3B8]">Passage not found</p>
        <button
          onClick={() => router.push("/dashboard/reading")}
          className="rounded-xl bg-[#6366F1] px-6 py-3 text-sm font-medium text-white hover:bg-[#818CF8]"
        >
          Back to Reading
        </button>
      </div>
    );
  }

  // --------------- Results View ---------------
  if (submitted) {
    return (
      <div className="mx-auto max-w-3xl">
        <div className="animate-fade-up flex items-center gap-3">
          <button
            onClick={() => router.push("/dashboard/reading")}
            className="flex h-10 w-10 items-center justify-center rounded-full border-[0.5px] border-[#2A3150] bg-[#1E2540] transition-all duration-200 hover:border-[rgba(99,102,241,0.3)]"
          >
            <ArrowLeft size={20} strokeWidth={1.75} className="text-[#94A3B8]" />
          </button>
          <h1 className="text-base font-medium text-[#F8FAFC]">Test Results</h1>
        </div>

        {gradableTotal > 0 ? (
          <div className="animate-fade-up animate-fade-up-1 mt-8 flex flex-col items-center">
            <ScoreGauge correct={correctCount} total={gradableTotal} />
          </div>
        ) : (
          <div className="animate-fade-up animate-fade-up-1 mt-8 flex flex-col items-center gap-2">
            <p className="text-lg font-semibold text-[#F8FAFC]">Answers Submitted</p>
            <p className="text-sm text-[#94A3B8]">
              Answer key not available for auto-grading. Review your answers below.
            </p>
          </div>
        )}

        <div className="animate-fade-up animate-fade-up-2 mt-8 space-y-3">
          <h2 className="text-base font-semibold text-[#F8FAFC]">Answer Review</h2>
          {results.map((r, i) => (
            <div
              key={r.questionNumber}
              className={`animate-fade-up rounded-xl border-[0.5px] p-4 ${
                !r.hasAnswer
                  ? "border-[#2A3150] bg-[#1E2540]"
                  : r.isCorrect
                    ? "border-[rgba(34,197,94,0.3)] bg-[#1E2540]"
                    : "border-[rgba(239,68,68,0.3)] bg-[#1E2540]"
              }`}
              style={{ animationDelay: `${200 + i * 50}ms` }}
            >
              <div className="flex items-start gap-3">
                {r.hasAnswer ? (
                  r.isCorrect ? (
                    <CheckCircle size={18} strokeWidth={1.75} className="mt-0.5 shrink-0 text-[#22C55E]" />
                  ) : (
                    <XCircle size={18} strokeWidth={1.75} className="mt-0.5 shrink-0 text-[#EF4444]" />
                  )
                ) : (
                  <FileText size={18} strokeWidth={1.75} className="mt-0.5 shrink-0 text-[#64748B]" />
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-[#F8FAFC]">
                    <span className="font-medium text-[#64748B]">Q{r.questionNumber}.</span>{" "}
                    {r.questionText}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-x-6 gap-y-1 text-[13px]">
                    <span className="text-[#94A3B8]">
                      Your answer:{" "}
                      <span
                        className={`font-medium ${
                          !r.hasAnswer
                            ? "text-[#F8FAFC]"
                            : r.isCorrect
                              ? "text-[#22C55E]"
                              : "text-[#EF4444]"
                        }`}
                      >
                        {r.studentAnswer || "(blank)"}
                      </span>
                    </span>
                    {r.hasAnswer && !r.isCorrect && (
                      <span className="text-[#94A3B8]">
                        Correct:{" "}
                        <span className="font-medium text-[#22C55E]">{r.correctAnswer}</span>
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="animate-fade-up animate-fade-up-3 mt-8 flex flex-col gap-3 pb-8 sm:flex-row">
          <button
            onClick={() => {
              setAnswers({});
              setSubmitted(false);
              setTimeLeft(20 * 60);
            }}
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border-[0.5px] border-[#2A3150] py-3 text-[15px] font-medium text-[#94A3B8] transition-all duration-200 hover:border-[#6366F1] hover:text-white"
          >
            Practice Again
          </button>
          <button
            onClick={() => router.push("/dashboard/reading")}
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#6366F1] py-3 text-[15px] font-medium text-white transition-colors duration-200 hover:bg-[#818CF8]"
          >
            Back to Reading
          </button>
        </div>
      </div>
    );
  }

  // --------------- Test View ---------------
  const progressPct = totalQuestions > 0 ? (answeredCount / totalQuestions) * 100 : 0;

  const passagePanel = (
    <div className="space-y-4">
      {passage.title && (
        <h2 className="font-heading text-xl font-bold text-[#F8FAFC]">{passage.title}</h2>
      )}
      {passage.topic && (
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 rounded-full bg-[rgba(168,85,247,0.15)] px-3 py-1 text-xs font-medium text-[#A855F7]">
            <Tag size={12} strokeWidth={1.75} />
            {passage.topic}
          </span>
          {passage.difficulty && (
            <span className="text-xs capitalize text-[#64748B]">{passage.difficulty}</span>
          )}
        </div>
      )}
      {hasContent && !passage.passage ? (
        <div
          className="prose-dark text-[15px] leading-[1.8] text-[#94A3B8]"
          dangerouslySetInnerHTML={{ __html: renderMarkdown(passageText) }}
        />
      ) : (
        <div className="text-[15px] leading-[1.8] text-[#94A3B8]">
          {passageText.split("\n").map((p, i) =>
            p.trim() ? <p key={i} className="mb-4">{p}</p> : null
          )}
        </div>
      )}
    </div>
  );

  const questionsPanel = (
    <div className="space-y-4">
      <h2 className="text-base font-semibold text-[#F8FAFC]">
        Questions{totalQuestions > 0 ? ` (1-${totalQuestions})` : ""}
      </h2>
      {totalQuestions === 0 ? (
        <p className="text-sm text-[#64748B]">No questions available for this passage.</p>
      ) : (
        effectiveQuestions.map((q) => (
          <div
            key={q.questionNumber}
            className="rounded-xl border-[0.5px] border-[#2A3150] bg-[#1E2540] p-4"
          >
            <p className="mb-3 text-sm text-[#F8FAFC]">
              <span className="mr-1.5 font-bold text-[#6366F1]">{q.questionNumber}.</span>
              {q.questionText}
            </p>
            {hasStructuredQuestions ? (
              renderStructuredQuestion(
                q as Question,
                answers[q.questionNumber] || "",
                (v) => setAnswer(q.questionNumber, v)
              )
            ) : (
              <input
                type="text"
                value={answers[q.questionNumber] || ""}
                onChange={(e) => setAnswer(q.questionNumber, e.target.value)}
                placeholder="Type your answer..."
                className="w-full rounded-lg border-[0.5px] border-[#2A3150] bg-[#12172B] px-3 py-2.5 text-sm text-[#F8FAFC] outline-none transition-colors placeholder:text-[#64748B] focus:border-[#6366F1]"
              />
            )}
          </div>
        ))
      )}
    </div>
  );

  return (
    <div className="flex min-h-[calc(100dvh-80px)] flex-col">
      {/* Leave dialog */}
      {showLeaveDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-sm rounded-xl border-[0.5px] border-[#2A3150] bg-[#12172B] p-6">
            <h3 className="text-base font-semibold text-[#F8FAFC]">Leave test?</h3>
            <p className="mt-2 text-sm text-[#94A3B8]">
              Are you sure you want to leave? Your progress will be lost.
            </p>
            <div className="mt-5 flex gap-3">
              <button
                onClick={() => setShowLeaveDialog(false)}
                className="flex-1 rounded-lg border-[0.5px] border-[#2A3150] py-2.5 text-sm font-medium text-[#94A3B8] transition-all hover:border-[#6366F1] hover:text-white"
              >
                Stay
              </button>
              <button
                onClick={() => router.push("/dashboard/reading")}
                className="flex-1 rounded-lg bg-[#EF4444] py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#DC2626]"
              >
                Leave
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Top bar */}
      <div className="animate-fade-up flex items-center justify-between">
        <button
          onClick={handleBack}
          className="flex h-10 w-10 items-center justify-center rounded-full border-[0.5px] border-[#2A3150] bg-[#1E2540] transition-all duration-200 hover:border-[rgba(99,102,241,0.3)]"
        >
          <ArrowLeft size={20} strokeWidth={1.75} className="text-[#94A3B8]" />
        </button>
        <h1 className="text-base font-medium text-[#F8FAFC]">Reading Test</h1>
        <span
          className={`flex items-center gap-1.5 text-sm font-medium ${
            timeLeft < 300 ? "text-[#EF4444]" : "text-[#64748B]"
          }`}
        >
          <Clock size={16} strokeWidth={1.75} />
          {formatTime(timeLeft)}
        </span>
      </div>

      {/* Mobile tabs */}
      <div className="mt-4 flex gap-2 md:hidden">
        <button
          onClick={() => setMobileTab("passage")}
          className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2.5 text-sm font-medium transition-all ${
            mobileTab === "passage"
              ? "bg-[#6366F1] text-white"
              : "bg-[#1E2540] text-[#94A3B8]"
          }`}
        >
          <BookOpen size={16} strokeWidth={1.75} />
          Passage
        </button>
        <button
          onClick={() => setMobileTab("questions")}
          className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2.5 text-sm font-medium transition-all ${
            mobileTab === "questions"
              ? "bg-[#6366F1] text-white"
              : "bg-[#1E2540] text-[#94A3B8]"
          }`}
        >
          <FileText size={16} strokeWidth={1.75} />
          Questions
          {answeredCount > 0 && (
            <span className="ml-1 flex h-5 w-5 items-center justify-center rounded-full bg-[rgba(99,102,241,0.3)] text-xs text-white">
              {answeredCount}
            </span>
          )}
        </button>
      </div>

      {/* Desktop two-column */}
      <div className="mt-4 hidden flex-1 gap-4 overflow-hidden md:flex">
        <div className="w-[55%] overflow-y-auto rounded-xl border-[0.5px] border-[#2A3150] bg-[#1E2540] p-6">
          {passagePanel}
        </div>
        <div className="w-[45%] overflow-y-auto rounded-xl border-[0.5px] border-[#2A3150] bg-[#1E2540] p-6">
          {questionsPanel}
        </div>
      </div>

      {/* Mobile single view */}
      <div className="mt-4 flex-1 overflow-y-auto md:hidden">
        <div className="rounded-xl border-[0.5px] border-[#2A3150] bg-[#1E2540] p-5">
          {mobileTab === "passage" ? passagePanel : questionsPanel}
        </div>
      </div>

      {/* Bottom bar */}
      <div className="mt-4 rounded-xl border-[0.5px] border-[#2A3150] bg-[#1E2540] p-4">
        <div className="flex items-center justify-between gap-4">
          <div className="min-w-0 flex-1">
            <p className="text-[13px] text-[#64748B]">
              {answeredCount} of {totalQuestions} answered
            </p>
            <div className="mt-1.5 h-1 w-full rounded-full bg-[#2A3150]">
              <div
                className="h-1 rounded-full bg-[#6366F1] transition-all duration-300"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>
          <button
            onClick={handleSubmit}
            disabled={answeredCount === 0}
            className="shrink-0 rounded-xl bg-[#6366F1] px-6 py-3 text-[15px] font-medium text-white transition-colors duration-200 hover:bg-[#818CF8] disabled:cursor-not-allowed disabled:opacity-50"
          >
            Submit Answers
          </button>
        </div>
      </div>
    </div>
  );
}

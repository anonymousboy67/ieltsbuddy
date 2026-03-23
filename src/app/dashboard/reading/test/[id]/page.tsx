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
import { QuestionType } from "@/types/ielts";

/* ── Data interfaces ─────────────────────────────────────────── */

interface MatchingOption {
  letter: string;
  text: string;
}

interface Question {
  questionNumber: number;
  questionText?: string;
  options?: string[];
  correctAnswer: string | string[];
}

interface QuestionGroup {
  groupLabel: string;
  questionType: QuestionType;
  instructions: string;
  wordLimit?: string;
  startQuestion: number;
  endQuestion: number;
  matchingOptions?: MatchingOption[];
  completionTemplate?: string;
  tableData?: { headers: string[]; rows: unknown[] };
  wordBank?: string[];
  sectionLabels?: string[];
  allowRepeat?: boolean;
  imageUrl?: string;
  questions: Question[];
}

interface PassageSection {
  label: string;
  text: string;
}

interface PassageData {
  _id: string;
  bookNumber: number;
  testNumber: number;
  passageNumber: number;
  title: string;
  subtitle?: string;
  topic?: string;
  difficulty?: string;
  passage: string;
  passageSections?: PassageSection[];
  totalQuestions: number;
  questionGroups: QuestionGroup[];
  footnotes?: string[];
}

type Answers = Record<number, string>;
type MultiAnswers = Record<number, string[]>;

/* ── Helpers ──────────────────────────────────────────────────── */

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

function normalizeAnswer(ans: string | string[]): string {
  if (Array.isArray(ans)) return ans.map((a) => a.trim().toLowerCase()).sort().join(",");
  return ans.trim().toLowerCase();
}

const TYPE_LABELS: Record<string, string> = {
  [QuestionType.TRUE_FALSE_NOT_GIVEN]: "True / False / Not Given",
  [QuestionType.YES_NO_NOT_GIVEN]: "Yes / No / Not Given",
  [QuestionType.MULTIPLE_CHOICE]: "Multiple Choice",
  [QuestionType.MULTIPLE_SELECT]: "Multiple Select",
  [QuestionType.NOTE_COMPLETION]: "Note Completion",
  [QuestionType.SUMMARY_COMPLETION]: "Summary Completion",
  [QuestionType.SENTENCE_COMPLETION]: "Sentence Completion",
  [QuestionType.TABLE_COMPLETION]: "Table Completion",
  [QuestionType.FORM_COMPLETION]: "Form Completion",
  [QuestionType.FLOW_CHART_COMPLETION]: "Flow Chart Completion",
  [QuestionType.DIAGRAM_LABELLING]: "Diagram Labelling",
  [QuestionType.MAP_LABELLING]: "Map Labelling",
  [QuestionType.SHORT_ANSWER]: "Short Answer",
  [QuestionType.MATCHING_HEADINGS]: "Matching Headings",
  [QuestionType.MATCHING_INFORMATION]: "Matching Information",
  [QuestionType.MATCHING_FEATURES]: "Matching Features",
  [QuestionType.MATCHING_SENTENCE_ENDINGS]: "Matching Sentence Endings",
};

const inputCls =
  "w-full rounded-lg border-[0.5px] border-[#2A3150] bg-[#12172B] px-3 py-2.5 text-sm text-[#F8FAFC] outline-none transition-colors placeholder:text-[#64748B] focus:border-[#6366F1]";

const selectCls =
  "w-full rounded-lg border-[0.5px] border-[#2A3150] bg-[#12172B] px-3 py-2.5 text-sm text-[#F8FAFC] outline-none transition-colors focus:border-[#6366F1]";

/* ── Shared UI atoms ──────────────────────────────────────────── */

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
      <input type="radio" name={name} checked={selected} onChange={onChange} className="sr-only" />
      <span
        className={`flex h-4 w-4 items-center justify-center rounded-full border-[1.5px] ${
          selected ? "border-[#6366F1]" : "border-[#64748B]"
        }`}
      >
        {selected && <span className="h-2 w-2 rounded-full bg-[#6366F1]" />}
      </span>
      <span className={`text-sm ${selected ? "text-[#F8FAFC]" : "text-[#94A3B8]"}`}>{label}</span>
    </label>
  );
}

function CheckboxOption({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <label
      className={`flex cursor-pointer items-center gap-3 rounded-lg border-[0.5px] px-4 py-2.5 transition-all duration-150 ${
        checked
          ? "border-[#6366F1] bg-[rgba(99,102,241,0.1)]"
          : "border-[#2A3150] bg-[#1E2540] hover:border-[rgba(99,102,241,0.3)]"
      }`}
    >
      <input type="checkbox" checked={checked} onChange={onChange} className="sr-only" />
      <span
        className={`flex h-4 w-4 items-center justify-center rounded border-[1.5px] ${
          checked ? "border-[#6366F1] bg-[#6366F1]" : "border-[#64748B]"
        }`}
      >
        {checked && (
          <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
            <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </span>
      <span className={`text-sm ${checked ? "text-[#F8FAFC]" : "text-[#94A3B8]"}`}>{label}</span>
    </label>
  );
}

/* ── Completion template renderer ─────────────────────────────── */

function CompletionTemplate({
  template,
  questions,
  answers,
  onAnswer,
}: {
  template: string;
  questions: Question[];
  answers: Answers;
  onAnswer: (qNum: number, val: string) => void;
}) {
  // Split template by blank markers like (7), (8), etc.
  const parts = template.split(/\((\d+)\)\s*\.{0,6}/);

  const qNums = new Set(questions.map((q) => q.questionNumber));

  return (
    <div className="rounded-xl border-[0.5px] border-[#2A3150] bg-[#12172B] p-4 text-sm leading-relaxed text-[#94A3B8]">
      {parts.map((part, i) => {
        if (i % 2 === 1) {
          const num = parseInt(part);
          if (qNums.has(num)) {
            return (
              <span key={i} className="inline-flex items-center gap-1">
                <span className="text-xs font-bold text-[#6366F1]">({num})</span>
                <input
                  type="text"
                  value={answers[num] || ""}
                  onChange={(e) => onAnswer(num, e.target.value)}
                  placeholder="..."
                  className="mx-1 inline-block w-32 rounded border-[0.5px] border-[#2A3150] bg-[#1E2540] px-2 py-1 text-sm text-[#F8FAFC] outline-none focus:border-[#6366F1]"
                />
              </span>
            );
          }
        }
        // Render text, preserving newlines
        return (
          <span key={i}>
            {part.split("\n").map((line, j) => (
              <span key={j}>
                {j > 0 && <br />}
                {line}
              </span>
            ))}
          </span>
        );
      })}
    </div>
  );
}

/* ── Question group renderer ──────────────────────────────────── */

function QuestionGroupRenderer({
  group,
  answers,
  multiAnswers,
  onAnswer,
  onMultiAnswer,
}: {
  group: QuestionGroup;
  answers: Answers;
  multiAnswers: MultiAnswers;
  onAnswer: (qNum: number, val: string) => void;
  onMultiAnswer: (qNum: number, val: string[]) => void;
}) {
  const t = group.questionType;

  // Build dropdown options for matching types
  const dropdownOptions = useMemo(() => {
    if (group.matchingOptions && group.matchingOptions.length > 0) {
      return group.matchingOptions.map((o) => ({
        value: o.letter,
        label: `${o.letter} - ${o.text}`,
      }));
    }
    if (group.sectionLabels && group.sectionLabels.length > 0) {
      return group.sectionLabels.map((l) => ({ value: l, label: l }));
    }
    return null;
  }, [group.matchingOptions, group.sectionLabels]);

  // Completion types with template
  const isCompletion =
    t === QuestionType.NOTE_COMPLETION ||
    t === QuestionType.SUMMARY_COMPLETION ||
    t === QuestionType.SENTENCE_COMPLETION ||
    t === QuestionType.FORM_COMPLETION ||
    t === QuestionType.FLOW_CHART_COMPLETION;

  const hasTemplate = isCompletion && group.completionTemplate;

  return (
    <div className="space-y-3">
      {/* Group header */}
      <div className="rounded-lg border-[0.5px] border-[rgba(99,102,241,0.2)] bg-[rgba(99,102,241,0.05)] px-4 py-3">
        <p className="text-sm font-semibold text-[#818CF8]">
          {group.groupLabel}
        </p>
        <p className="mt-1 text-xs text-[#94A3B8]">
          {TYPE_LABELS[t] || t}
          {group.wordLimit && (
            <span className="ml-2 text-[#64748B]">({group.wordLimit})</span>
          )}
          {group.allowRepeat && (
            <span className="ml-2 text-[#64748B]">(answers may be reused)</span>
          )}
        </p>
        {group.instructions && (
          <p className="mt-2 text-xs leading-relaxed text-[#64748B]">
            {group.instructions}
          </p>
        )}
      </div>

      {/* Word bank */}
      {group.wordBank && group.wordBank.length > 0 && (
        <div className="flex flex-wrap gap-2 rounded-lg border-[0.5px] border-[#2A3150] bg-[#12172B] p-3">
          <span className="text-xs font-medium text-[#64748B]">Word bank:</span>
          {group.wordBank.map((w) => (
            <span
              key={w}
              className="rounded-full bg-[#1E2540] px-2.5 py-0.5 text-xs text-[#94A3B8]"
            >
              {w}
            </span>
          ))}
        </div>
      )}

      {/* Matching options reference (for MATCHING_SENTENCE_ENDINGS, MATCHING_FEATURES, etc.) */}
      {dropdownOptions &&
        (t === QuestionType.MATCHING_SENTENCE_ENDINGS ||
          t === QuestionType.MATCHING_FEATURES ||
          t === QuestionType.MATCHING_HEADINGS) && (
          <div className="rounded-lg border-[0.5px] border-[#2A3150] bg-[#12172B] p-3 text-xs text-[#94A3B8]">
            {group.matchingOptions?.map((o) => (
              <p key={o.letter} className="py-0.5">
                <span className="font-bold text-[#F8FAFC]">{o.letter}</span> {o.text}
              </p>
            ))}
          </div>
        )}

      {/* Completion template */}
      {hasTemplate && (
        <CompletionTemplate
          template={group.completionTemplate!}
          questions={group.questions}
          answers={answers}
          onAnswer={onAnswer}
        />
      )}

      {/* Table completion */}
      {t === QuestionType.TABLE_COMPLETION && group.tableData && (
        <div className="overflow-x-auto rounded-lg border-[0.5px] border-[#2A3150]">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#12172B]">
                {group.tableData.headers.map((h, i) => (
                  <th
                    key={i}
                    className="border-[0.5px] border-[#2A3150] px-3 py-2 text-left text-xs font-medium text-[#94A3B8]"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {group.tableData.rows.map((row, ri) => (
                <tr key={ri}>
                  {(row as string[]).map((cell: string, ci: number) => {
                    const blankMatch = cell.match(/\((\d+)\)/);
                    if (blankMatch) {
                      const qNum = parseInt(blankMatch[1]);
                      return (
                        <td
                          key={ci}
                          className="border-[0.5px] border-[#2A3150] px-2 py-1.5"
                        >
                          <div className="flex items-center gap-1">
                            <span className="text-xs font-bold text-[#6366F1]">
                              ({qNum})
                            </span>
                            <input
                              type="text"
                              value={answers[qNum] || ""}
                              onChange={(e) => onAnswer(qNum, e.target.value)}
                              placeholder="..."
                              className="w-full rounded border-[0.5px] border-[#2A3150] bg-[#1E2540] px-2 py-1 text-sm text-[#F8FAFC] outline-none focus:border-[#6366F1]"
                            />
                          </div>
                        </td>
                      );
                    }
                    return (
                      <td
                        key={ci}
                        className="border-[0.5px] border-[#2A3150] px-3 py-1.5 text-[#94A3B8]"
                      >
                        {cell}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Diagram / Map image */}
      {(t === QuestionType.DIAGRAM_LABELLING || t === QuestionType.MAP_LABELLING) &&
        group.imageUrl && (
          <div className="flex justify-center rounded-lg border-[0.5px] border-[#2A3150] bg-[#12172B] p-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={group.imageUrl}
              alt="Diagram"
              className="max-h-80 rounded object-contain"
            />
          </div>
        )}

      {/* Individual questions */}
      {group.questions.map((q) => {
        const name = `q-${q.questionNumber}`;
        const answer = answers[q.questionNumber] || "";
        const multi = multiAnswers[q.questionNumber] || [];

        // Skip rendering individual inputs for questions already rendered in template
        if (hasTemplate) {
          return null;
        }

        // Skip questions rendered in table
        if (t === QuestionType.TABLE_COMPLETION && group.tableData) {
          return null;
        }

        return (
          <div
            key={q.questionNumber}
            className="rounded-xl border-[0.5px] border-[#2A3150] bg-[#1E2540] p-4"
          >
            <p className="mb-3 text-sm text-[#F8FAFC]">
              <span className="mr-1.5 font-bold text-[#6366F1]">
                {q.questionNumber}.
              </span>
              {q.questionText || ""}
            </p>

            {/* TRUE_FALSE_NOT_GIVEN */}
            {t === QuestionType.TRUE_FALSE_NOT_GIVEN && (
              <div className="space-y-2">
                {["TRUE", "FALSE", "NOT GIVEN"].map((o) => (
                  <RadioOption
                    key={o}
                    label={o}
                    selected={answer === o}
                    name={name}
                    onChange={() => onAnswer(q.questionNumber, o)}
                  />
                ))}
              </div>
            )}

            {/* YES_NO_NOT_GIVEN */}
            {t === QuestionType.YES_NO_NOT_GIVEN && (
              <div className="space-y-2">
                {["YES", "NO", "NOT GIVEN"].map((o) => (
                  <RadioOption
                    key={o}
                    label={o}
                    selected={answer === o}
                    name={name}
                    onChange={() => onAnswer(q.questionNumber, o)}
                  />
                ))}
              </div>
            )}

            {/* MULTIPLE_CHOICE */}
            {t === QuestionType.MULTIPLE_CHOICE && (
              <div className="space-y-2">
                {(q.options && q.options.length > 0
                  ? q.options
                  : ["A", "B", "C", "D"]
                ).map((o, i) => {
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
                      <input
                        type="radio"
                        name={name}
                        checked={answer === letter}
                        onChange={() => onAnswer(q.questionNumber, letter)}
                        className="sr-only"
                      />
                      <span
                        className={`flex h-5 w-5 items-center justify-center rounded-full text-xs font-medium ${
                          answer === letter
                            ? "bg-[#6366F1] text-white"
                            : "bg-[#2A3150] text-[#94A3B8]"
                        }`}
                      >
                        {letter}
                      </span>
                      <span
                        className={`text-sm ${
                          answer === letter ? "text-[#F8FAFC]" : "text-[#94A3B8]"
                        }`}
                      >
                        {o}
                      </span>
                    </label>
                  );
                })}
              </div>
            )}

            {/* MULTIPLE_SELECT */}
            {t === QuestionType.MULTIPLE_SELECT && (() => {
              const opts =
                group.matchingOptions && group.matchingOptions.length > 0
                  ? group.matchingOptions.map((o) => ({
                      value: o.letter,
                      label: `${o.letter} - ${o.text}`,
                    }))
                  : (q.options || ["A", "B", "C", "D", "E"]).map((o, i) => ({
                      value: String.fromCharCode(65 + i),
                      label: o,
                    }));

              return (
                <div className="space-y-2">
                  {opts.map((o) => (
                    <CheckboxOption
                      key={o.value}
                      label={o.label}
                      checked={multi.includes(o.value)}
                      onChange={() => {
                        const newMulti = multi.includes(o.value)
                          ? multi.filter((v) => v !== o.value)
                          : [...multi, o.value];
                        onMultiAnswer(q.questionNumber, newMulti);
                        onAnswer(q.questionNumber, newMulti.sort().join(","));
                      }}
                    />
                  ))}
                </div>
              );
            })()}

            {/* MATCHING types — dropdown */}
            {(t === QuestionType.MATCHING_HEADINGS ||
              t === QuestionType.MATCHING_INFORMATION ||
              t === QuestionType.MATCHING_FEATURES ||
              t === QuestionType.MATCHING_SENTENCE_ENDINGS) && (
              <select
                value={answer}
                onChange={(e) => onAnswer(q.questionNumber, e.target.value)}
                className={selectCls}
              >
                <option value="">Select...</option>
                {(dropdownOptions || [{ value: "A", label: "A" }]).map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            )}

            {/* Completion types without template — text input */}
            {(t === QuestionType.NOTE_COMPLETION ||
              t === QuestionType.SUMMARY_COMPLETION ||
              t === QuestionType.SENTENCE_COMPLETION ||
              t === QuestionType.FORM_COMPLETION ||
              t === QuestionType.FLOW_CHART_COMPLETION) &&
              !hasTemplate && (
                <input
                  type="text"
                  value={answer}
                  onChange={(e) => onAnswer(q.questionNumber, e.target.value)}
                  placeholder="Type your answer..."
                  className={inputCls}
                />
              )}

            {/* DIAGRAM_LABELLING / MAP_LABELLING — text input */}
            {(t === QuestionType.DIAGRAM_LABELLING ||
              t === QuestionType.MAP_LABELLING) && (
              <input
                type="text"
                value={answer}
                onChange={(e) => onAnswer(q.questionNumber, e.target.value)}
                placeholder="Type your answer..."
                className={inputCls}
              />
            )}

            {/* SHORT_ANSWER — text input */}
            {t === QuestionType.SHORT_ANSWER && (
              <input
                type="text"
                value={answer}
                onChange={(e) => onAnswer(q.questionNumber, e.target.value)}
                placeholder="Type your answer..."
                className={inputCls}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ── Score Gauge ───────────────────────────────────────────────── */

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

/* ── Main Component ───────────────────────────────────────────── */

export default function ReadingTestPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [passage, setPassage] = useState<PassageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [answers, setAnswers] = useState<Answers>({});
  const [multiAnswers, setMultiAnswers] = useState<MultiAnswers>({});
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

  // All questions flat list
  const allQuestions = useMemo(() => {
    if (!passage?.questionGroups) return [];
    return passage.questionGroups.flatMap((g) =>
      g.questions.map((q) => ({ ...q, questionType: g.questionType }))
    );
  }, [passage]);

  const totalQuestions = allQuestions.length;

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

  const setMultiAnswer = useCallback((qNum: number, value: string[]) => {
    setMultiAnswers((prev) => ({ ...prev, [qNum]: value }));
  }, []);

  const answeredCount = Object.values(answers).filter((v) => v.trim() !== "").length;

  // Grading
  const results = useMemo(() => {
    if (!submitted) return [];
    return allQuestions.map((q) => {
      const studentAns = normalizeAnswer(answers[q.questionNumber] || "");
      const correct = normalizeAnswer(q.correctAnswer);
      const isCorrect = correct !== "" && studentAns === correct;
      return {
        ...q,
        studentAnswer: answers[q.questionNumber] || "",
        isCorrect,
        hasAnswer: correct !== "",
      };
    });
  }, [submitted, allQuestions, answers]);

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

  // Loading state
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

  /* ── Results View ─────────────────────────────────────────── */
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
          <div className="animate-fade-up mt-8 flex flex-col items-center">
            <ScoreGauge correct={correctCount} total={gradableTotal} />
          </div>
        ) : (
          <div className="animate-fade-up mt-8 flex flex-col items-center gap-2">
            <p className="text-lg font-semibold text-[#F8FAFC]">Answers Submitted</p>
            <p className="text-sm text-[#94A3B8]">
              Answer key not available for auto-grading.
            </p>
          </div>
        )}

        <div className="mt-8 space-y-3">
          <h2 className="text-base font-semibold text-[#F8FAFC]">Answer Review</h2>
          {results.map((r) => (
            <div
              key={r.questionNumber}
              className={`rounded-xl border-[0.5px] p-4 ${
                !r.hasAnswer
                  ? "border-[#2A3150] bg-[#1E2540]"
                  : r.isCorrect
                    ? "border-[rgba(34,197,94,0.3)] bg-[#1E2540]"
                    : "border-[rgba(239,68,68,0.3)] bg-[#1E2540]"
              }`}
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
                    {r.questionText || `(${TYPE_LABELS[r.questionType] || r.questionType})`}
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
                        <span className="font-medium text-[#22C55E]">
                          {Array.isArray(r.correctAnswer)
                            ? r.correctAnswer.join(", ")
                            : r.correctAnswer}
                        </span>
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 flex flex-col gap-3 pb-8 sm:flex-row">
          <button
            onClick={() => {
              setAnswers({});
              setMultiAnswers({});
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

  /* ── Test View ────────────────────────────────────────────── */
  const progressPct = totalQuestions > 0 ? (answeredCount / totalQuestions) * 100 : 0;

  const passagePanel = (
    <div className="space-y-4">
      {passage.title && (
        <h2 className="font-heading text-xl font-bold text-[#F8FAFC]">{passage.title}</h2>
      )}
      {passage.subtitle && (
        <p className="text-sm italic text-[#94A3B8]">{passage.subtitle}</p>
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
      {passage.passageSections && passage.passageSections.length > 0 ? (
        <div className="text-[15px] leading-[1.8] text-[#94A3B8]">
          {passage.passageSections.map((s) => (
            <div key={s.label} className="mb-4">
              <p className="font-bold text-[#F8FAFC]">{s.label}</p>
              {s.text.split("\n").map((p, i) =>
                p.trim() ? <p key={i} className="mb-3">{p}</p> : null
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="text-[15px] leading-[1.8] text-[#94A3B8]">
          {passage.passage.split("\n").map((p, i) =>
            p.trim() ? <p key={i} className="mb-4">{p}</p> : null
          )}
        </div>
      )}
      {passage.footnotes && passage.footnotes.length > 0 && (
        <div className="border-t-[0.5px] border-[#2A3150] pt-3">
          {passage.footnotes.map((fn, i) => (
            <p key={i} className="text-xs italic text-[#64748B]">{fn}</p>
          ))}
        </div>
      )}
    </div>
  );

  const questionsPanel = (
    <div className="space-y-6">
      <h2 className="text-base font-semibold text-[#F8FAFC]">
        Questions ({passage.totalQuestions || totalQuestions})
      </h2>
      {passage.questionGroups.length === 0 ? (
        <p className="text-sm text-[#64748B]">No questions available for this passage.</p>
      ) : (
        passage.questionGroups.map((group, i) => (
          <QuestionGroupRenderer
            key={i}
            group={group}
            answers={answers}
            multiAnswers={multiAnswers}
            onAnswer={setAnswer}
            onMultiAnswer={setMultiAnswer}
          />
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
              Your progress will be lost.
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
        <h1 className="text-base font-medium text-[#F8FAFC]">
          {passage.title || "Reading Test"}
        </h1>
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

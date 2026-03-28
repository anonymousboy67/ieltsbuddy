"use client";

import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { Play, Pause, Volume2 } from "lucide-react";
import { QuestionType } from "@/types/ielts";

/* ── Types ───────────────────────────────────────────────────────── */
export interface MatchingOption {
  letter: string;
  text: string;
}

export interface Question {
  questionNumber: number;
  questionText?: string;
  options?: string[];
  correctAnswer: string | string[];
}

export interface QuestionGroup {
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

export interface ListeningPart {
  _id: string;
  bookNumber: number;
  testNumber: number;
  partNumber: number;
  title?: string;
  audioUrl?: string;
  transcript?: string;
  context?: string;
  totalQuestions: number;
  questionGroups: QuestionGroup[];
}

interface MockListeningWrapperProps {
  parts: ListeningPart[];
  answers: Record<number, string>;
  onAnswer: (qNum: number, value: string) => void;
}

/* ── Helpers ──────────────────────────────────────────────────── */

function formatTime(s: number): string {
  const m = Math.floor(s / 60)
    .toString()
    .padStart(2, "0");
  const sec = (s % 60).toString().padStart(2, "0");
  return `${m}:${sec}`;
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

/* ── UI atoms ─────────────────────────────────────────────────── */

function RadioOption({ label, selected, name, onChange }: { label: string; selected: boolean; name: string; onChange: () => void }) {
  return (
    <label className={`flex cursor-pointer items-center gap-3 rounded-lg border-[0.5px] px-4 py-2.5 transition-all duration-150 ${selected ? "border-[#6366F1] bg-[rgba(99,102,241,0.1)]" : "border-[#2A3150] bg-[#1E2540] hover:border-[rgba(99,102,241,0.3)]"}`}>
      <input type="radio" name={name} checked={selected} onChange={onChange} className="sr-only" />
      <span className={`flex h-4 w-4 items-center justify-center rounded-full border-[1.5px] ${selected ? "border-[#6366F1]" : "border-[#64748B]"}`}>
        {selected && <span className="h-2 w-2 rounded-full bg-[#6366F1]" />}
      </span>
      <span className={`text-sm ${selected ? "text-[#F8FAFC]" : "text-[#94A3B8]"}`}>{label}</span>
    </label>
  );
}

function CheckboxOption({ label, checked, onChange }: { label: string; checked: boolean; onChange: () => void }) {
  return (
    <label className={`flex cursor-pointer items-center gap-3 rounded-lg border-[0.5px] px-4 py-2.5 transition-all duration-150 ${checked ? "border-[#6366F1] bg-[rgba(99,102,241,0.1)]" : "border-[#2A3150] bg-[#1E2540] hover:border-[rgba(99,102,241,0.3)]"}`}>
      <input type="checkbox" checked={checked} onChange={onChange} className="sr-only" />
      <span className={`flex h-4 w-4 items-center justify-center rounded border-[1.5px] ${checked ? "border-[#6366F1] bg-[#6366F1]" : "border-[#64748B]"}`}>
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

function CompletionTemplate({ template, questions, answers, onAnswer }: { template: string; questions: Question[]; answers: Record<number, string>; onAnswer: (qNum: number, val: string) => void }) {
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

function AudioPlayer({ src }: { src: string }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onTime = () => setCurrentTime(audio.currentTime);
    const onMeta = () => setDuration(audio.duration);
    const onEnded = () => setPlaying(false);

    audio.addEventListener("timeupdate", onTime);
    audio.addEventListener("loadedmetadata", onMeta);
    audio.addEventListener("ended", onEnded);
    return () => {
      audio.removeEventListener("timeupdate", onTime);
      audio.removeEventListener("loadedmetadata", onMeta);
      audio.removeEventListener("ended", onEnded);
    };
  }, [src]);

  const toggle = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (playing) audio.pause();
    else audio.play();
    setPlaying(!playing);
  };

  const pct = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="rounded-xl border-[0.5px] border-[#2A3150] bg-[#1E2540] p-4 mb-6">
      <audio ref={audioRef} src={src} preload="metadata" />
      <div className="flex items-center gap-3">
        <button
          onClick={toggle}
          className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-[#6366F1] text-white transition-colors hover:bg-[#818CF8]"
        >
          {playing ? <Pause size={18} strokeWidth={1.75} /> : <Play size={18} strokeWidth={1.75} className="ml-0.5" />}
        </button>
        <div className="min-w-0 flex-1">
          <div className="relative h-1.5 w-full rounded-full bg-[#2A3150]">
            <div className="h-1.5 rounded-full bg-[#22C55E] transition-all" style={{ width: `${pct}%` }} />
          </div>
          <div className="mt-1 flex justify-between text-xs text-[#64748B]">
            <span>{formatTime(Math.floor(currentTime))}</span>
            <span>{duration > 0 ? formatTime(Math.floor(duration)) : "--:--"}</span>
          </div>
        </div>
        <Volume2 size={16} strokeWidth={1.75} className="flex-shrink-0 text-[#64748B]" />
      </div>
    </div>
  );
}

function QuestionGroupRenderer({ group, answers, multiAnswers, onAnswer, onMultiAnswer }: { group: QuestionGroup; answers: Record<number, string>; multiAnswers: Record<number, string[]>; onAnswer: (qNum: number, val: string) => void; onMultiAnswer: (qNum: number, val: string[]) => void }) {
  const t = group.questionType;

  const dropdownOptions = useMemo(() => {
    if (group.matchingOptions && group.matchingOptions.length > 0) return group.matchingOptions.map((o) => ({ value: o.letter, label: `${o.letter} - ${o.text}` }));
    if (group.sectionLabels && group.sectionLabels.length > 0) return group.sectionLabels.map((l) => ({ value: l, label: l }));
    return null;
  }, [group.matchingOptions, group.sectionLabels]);

  const isCompletion =
    t === QuestionType.NOTE_COMPLETION ||
    t === QuestionType.SUMMARY_COMPLETION ||
    t === QuestionType.SENTENCE_COMPLETION ||
    t === QuestionType.FORM_COMPLETION ||
    t === QuestionType.FLOW_CHART_COMPLETION;

  const hasTemplate = isCompletion && group.completionTemplate;

  return (
    <div className="space-y-3">
      <div className="rounded-lg border-[0.5px] border-[rgba(99,102,241,0.2)] bg-[rgba(99,102,241,0.05)] px-4 py-3">
        <p className="text-sm font-semibold text-[#818CF8]">{group.groupLabel}</p>
        <p className="mt-1 text-xs text-[#94A3B8]">
          {TYPE_LABELS[t] || t}
          {group.wordLimit && <span className="ml-2 text-[#64748B]">({group.wordLimit})</span>}
          {group.allowRepeat && <span className="ml-2 text-[#64748B]">(answers may be reused)</span>}
        </p>
        {group.instructions && <p className="mt-2 text-xs leading-relaxed text-[#64748B]">{group.instructions}</p>}
      </div>

      {group.wordBank && group.wordBank.length > 0 && (
        <div className="flex flex-wrap gap-2 rounded-lg border-[0.5px] border-[#2A3150] bg-[#12172B] p-3">
          <span className="text-xs font-medium text-[#64748B]">Word bank:</span>
          {group.wordBank.map((w) => <span key={w} className="rounded-full bg-[#1E2540] px-2.5 py-0.5 text-xs text-[#94A3B8]">{w}</span>)}
        </div>
      )}

      {dropdownOptions && (t === QuestionType.MATCHING_SENTENCE_ENDINGS || t === QuestionType.MATCHING_FEATURES || t === QuestionType.MATCHING_HEADINGS) && (
        <div className="rounded-lg border-[0.5px] border-[#2A3150] bg-[#12172B] p-3 text-xs text-[#94A3B8]">
          {group.matchingOptions?.map((o) => <p key={o.letter} className="py-0.5"><span className="font-bold text-[#F8FAFC]">{o.letter}</span> {o.text}</p>)}
        </div>
      )}

      {hasTemplate && <CompletionTemplate template={group.completionTemplate!} questions={group.questions} answers={answers} onAnswer={onAnswer} />}

      {t === QuestionType.TABLE_COMPLETION && group.tableData && (
        <div className="overflow-x-auto rounded-lg border-[0.5px] border-[#2A3150]">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#12172B]">
                {group.tableData.headers.map((h, i) => <th key={i} className="border-[0.5px] border-[#2A3150] px-3 py-2 text-left text-xs font-medium text-[#94A3B8]">{h}</th>)}
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
                        <td key={ci} className="border-[0.5px] border-[#2A3150] px-2 py-1.5">
                          <div className="flex items-center gap-1">
                            <span className="text-xs font-bold text-[#6366F1]">({qNum})</span>
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
                    return <td key={ci} className="border-[0.5px] border-[#2A3150] px-3 py-1.5 text-[#94A3B8]">{cell}</td>;
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {(t === QuestionType.DIAGRAM_LABELLING || t === QuestionType.MAP_LABELLING) && group.imageUrl && (
        <div className="flex justify-center rounded-lg border-[0.5px] border-[#2A3150] bg-[#12172B] p-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={group.imageUrl} alt="Diagram" className="max-h-80 rounded object-contain" />
        </div>
      )}

      {group.questions.map((q) => {
        const name = `q-${q.questionNumber}`;
        const answer = answers[q.questionNumber] || "";
        const multi = multiAnswers[q.questionNumber] || [];

        if (hasTemplate) return null;
        if (t === QuestionType.TABLE_COMPLETION && group.tableData) return null;

        return (
          <div key={q.questionNumber} className="rounded-xl border-[0.5px] border-[#2A3150] bg-[#1E2540] p-4">
            <p className="mb-3 text-sm text-[#F8FAFC]">
              <span className="mr-1.5 font-bold text-[#6366F1]">{q.questionNumber}.</span>
              {q.questionText || ""}
            </p>

            {t === QuestionType.TRUE_FALSE_NOT_GIVEN && (
              <div className="space-y-2">
                {["TRUE", "FALSE", "NOT GIVEN"].map((o) => (
                  <RadioOption key={o} label={o} selected={answer === o} name={name} onChange={() => onAnswer(q.questionNumber, o)} />
                ))}
              </div>
            )}

            {t === QuestionType.YES_NO_NOT_GIVEN && (
              <div className="space-y-2">
                {["YES", "NO", "NOT GIVEN"].map((o) => (
                  <RadioOption key={o} label={o} selected={answer === o} name={name} onChange={() => onAnswer(q.questionNumber, o)} />
                ))}
              </div>
            )}

            {t === QuestionType.MULTIPLE_CHOICE && (
              <div className="space-y-2">
                {(q.options && q.options.length > 0 ? q.options : ["A", "B", "C", "D"]).map((o, i) => {
                  const letter = String.fromCharCode(65 + i);
                  return (
                    <label
                      key={i}
                      className={`flex cursor-pointer items-center gap-3 rounded-lg border-[0.5px] px-4 py-2.5 transition-all duration-150 ${
                        answer === letter ? "border-[#6366F1] bg-[rgba(99,102,241,0.1)]" : "border-[#2A3150] bg-[#1E2540] hover:border-[rgba(99,102,241,0.3)]"
                      }`}
                    >
                      <input type="radio" name={name} checked={answer === letter} onChange={() => onAnswer(q.questionNumber, letter)} className="sr-only" />
                      <span className={`flex h-5 w-5 items-center justify-center rounded-full text-xs font-medium ${answer === letter ? "bg-[#6366F1] text-white" : "bg-[#2A3150] text-[#94A3B8]"}`}>{letter}</span>
                      <span className={`text-sm ${answer === letter ? "text-[#F8FAFC]" : "text-[#94A3B8]"}`}>{o}</span>
                    </label>
                  );
                })}
              </div>
            )}

            {t === QuestionType.MULTIPLE_SELECT && (() => {
              const opts = group.matchingOptions && group.matchingOptions.length > 0
                ? group.matchingOptions.map((o) => ({ value: o.letter, label: `${o.letter} - ${o.text}` }))
                : (q.options || ["A", "B", "C", "D", "E"]).map((o, i) => ({ value: String.fromCharCode(65 + i), label: o }));
              return (
                <div className="space-y-2">
                  {opts.map((o) => (
                    <CheckboxOption
                      key={o.value}
                      label={o.label}
                      checked={multi.includes(o.value)}
                      onChange={() => {
                        const newMulti = multi.includes(o.value) ? multi.filter((v) => v !== o.value) : [...multi, o.value];
                        onMultiAnswer(q.questionNumber, newMulti);
                        onAnswer(q.questionNumber, newMulti.sort().join(","));
                      }}
                    />
                  ))}
                </div>
              );
            })()}

            {(t === QuestionType.MATCHING_HEADINGS || t === QuestionType.MATCHING_INFORMATION || t === QuestionType.MATCHING_FEATURES || t === QuestionType.MATCHING_SENTENCE_ENDINGS) && (
              <select value={answer} onChange={(e) => onAnswer(q.questionNumber, e.target.value)} className={selectCls}>
                <option value="">Select...</option>
                {(dropdownOptions || [{ value: "A", label: "A" }]).map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            )}

            {isCompletion && !hasTemplate && (
              <input type="text" value={answer} onChange={(e) => onAnswer(q.questionNumber, e.target.value)} placeholder="Type your answer..." className={inputCls} />
            )}

            {(t === QuestionType.DIAGRAM_LABELLING || t === QuestionType.MAP_LABELLING) && (
              <input type="text" value={answer} onChange={(e) => onAnswer(q.questionNumber, e.target.value)} placeholder="Type your answer..." className={inputCls} />
            )}

            {t === QuestionType.SHORT_ANSWER && (
              <input type="text" value={answer} onChange={(e) => onAnswer(q.questionNumber, e.target.value)} placeholder="Type your answer..." className={inputCls} />
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ── Main Wrapper ─────────────────────────────────────────────── */

export default function MockListeningWrapper({ parts, answers, onAnswer }: MockListeningWrapperProps) {
  const [activeIdx, setActiveIdx] = useState(0);
  const [multiAnswers, setMultiAnswers] = useState<Record<number, string[]>>({});

  const handleMultiAnswer = useCallback((qNum: number, val: string[]) => {
    setMultiAnswers((prev) => ({ ...prev, [qNum]: val }));
  }, []);

  if (!parts || parts.length === 0) {
    return <div className="p-4 text-center text-sm text-[#94A3B8]">Loading listening parts...</div>;
  }

  const currentPart = parts[activeIdx];

  return (
    <div className="flex h-full flex-col gap-4">
      {/* Passage Tabs */}
      <div className="flex w-full rounded-xl bg-[#1E2540] p-1">
        {parts.map((p, idx) => (
          <button
            key={p._id}
            onClick={() => setActiveIdx(idx)}
            className={`flex-1 cursor-pointer rounded-lg py-2 text-center transition-all duration-200 ${
              activeIdx === idx ? "bg-[#6366F1] text-white" : "text-[#94A3B8] hover:text-[#F8FAFC]"
            }`}
          >
            <span className="block text-sm font-medium">Part {p.partNumber}</span>
          </button>
        ))}
      </div>

      {/* Content Area - Single Column for Listening */}
      <div className="flex-1 overflow-y-auto rounded-xl border-[0.5px] border-[#2A3150] bg-[#12172B] p-5 shadow-sm max-h-[600px] ielts-scrollbar">
        <div className="mb-6">
          <p className="text-xs font-semibold uppercase tracking-wider text-[#6366F1]">
            Listening Part {currentPart.partNumber}
          </p>
          {currentPart.title && (
            <h2 className="mt-1 font-serif text-2xl font-bold text-[#F8FAFC]">
              {currentPart.title}
            </h2>
          )}
          {currentPart.context && (
            <p className="mt-1 text-sm italic text-[#94A3B8]">{currentPart.context}</p>
          )}
        </div>

        {/* Audio Player */}
        {currentPart.audioUrl && <AudioPlayer src={currentPart.audioUrl} />}

        <div className="space-y-8">
          {currentPart.questionGroups?.map((group, i) => (
            <QuestionGroupRenderer
              key={i}
              group={group}
              answers={answers}
              multiAnswers={multiAnswers}
              onAnswer={onAnswer}
              onMultiAnswer={handleMultiAnswer}
            />
          ))}
          {(!currentPart.questionGroups || currentPart.questionGroups.length === 0) && (
            <p className="text-sm text-[#64748B]">No questions found for this part.</p>
          )}
        </div>
      </div>
    </div>
  );
}

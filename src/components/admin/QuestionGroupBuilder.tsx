"use client";

import { Plus, Trash2, ChevronDown, ChevronUp } from "lucide-react";
import FileUpload from "./FileUpload";
import TemplateEditor from "./TemplateEditor";

/* ── Types ────────────────────────────────────────────────────── */

export interface QuestionForm {
  questionNumber: number;
  questionText: string;
  options: string;
  correctAnswer: string;
}

export interface QuestionGroupForm {
  groupLabel: string;
  questionType: string;
  instructions: string;
  startQuestion: string;
  endQuestion: string;
  matchingOptions: string;
  completionTemplate: string;
  imageUrl: string;
  wordLimit: string;
  questions: QuestionForm[];
  collapsed: boolean;
}

const QUESTION_TYPES = [
  "TRUE_FALSE_NOT_GIVEN",
  "YES_NO_NOT_GIVEN",
  "MULTIPLE_CHOICE",
  "MULTIPLE_SELECT",
  "MATCHING_HEADINGS",
  "MATCHING_INFORMATION",
  "MATCHING_FEATURES",
  "MATCHING_SENTENCE_ENDINGS",
  "SENTENCE_COMPLETION",
  "SUMMARY_COMPLETION",
  "NOTE_COMPLETION",
  "TABLE_COMPLETION",
  "FORM_COMPLETION",
  "FLOW_CHART_COMPLETION",
  "DIAGRAM_LABELLING",
  "MAP_LABELLING",
  "SHORT_ANSWER",
];

const MATCHING_TYPES = [
  "MATCHING_HEADINGS",
  "MATCHING_INFORMATION",
  "MATCHING_FEATURES",
  "MATCHING_SENTENCE_ENDINGS",
];

const COMPLETION_TYPES = [
  "SENTENCE_COMPLETION",
  "SUMMARY_COMPLETION",
  "NOTE_COMPLETION",
  "TABLE_COMPLETION",
  "FORM_COMPLETION",
  "FLOW_CHART_COMPLETION",
];

const TEXT_QUESTION_TYPES = [
  "TRUE_FALSE_NOT_GIVEN",
  "YES_NO_NOT_GIVEN",
  "MULTIPLE_CHOICE",
  "MULTIPLE_SELECT",
  "MATCHING_INFORMATION",
  "MATCHING_FEATURES",
  "SHORT_ANSWER",
];

const inputCls =
  "w-full rounded-lg border-[0.5px] border-[#2A3150] bg-[#12172B] px-3 py-2 text-sm text-[#F8FAFC] outline-none focus:border-[#6366F1]";

/* ── Helpers ──────────────────────────────────────────────────── */

export function makeEmptyGroup(): QuestionGroupForm {
  return {
    groupLabel: "",
    questionType: "TRUE_FALSE_NOT_GIVEN",
    instructions: "",
    startQuestion: "",
    endQuestion: "",
    matchingOptions: "",
    completionTemplate: "",
    imageUrl: "",
    wordLimit: "",
    questions: [],
    collapsed: false,
  };
}

export function generateQuestions(start: number, end: number): QuestionForm[] {
  const qs: QuestionForm[] = [];
  for (let i = start; i <= end; i++) {
    qs.push({ questionNumber: i, questionText: "", options: "", correctAnswer: "" });
  }
  return qs;
}

export function serializeGroups(groups: QuestionGroupForm[]) {
  return groups.map((g) => ({
    groupLabel: g.groupLabel,
    questionType: g.questionType,
    instructions: g.instructions,
    startQuestion: Number(g.startQuestion),
    endQuestion: Number(g.endQuestion),
    matchingOptions: g.matchingOptions
      ? g.matchingOptions
          .split("\n")
          .map((s) => s.trim())
          .filter(Boolean)
          .map((line) => {
            const m = line.match(/^([A-Z])\s*[.:-]?\s*(.+)$/);
            return m ? { letter: m[1], text: m[2] } : { letter: "", text: line };
          })
      : [],
    completionTemplate: g.completionTemplate || undefined,
    imageUrl: g.imageUrl || undefined,
    wordLimit: g.wordLimit || undefined,
    questions: g.questions.map((q) => ({
      questionNumber: q.questionNumber,
      questionText: q.questionText || undefined,
      options: q.options ? q.options.split(",").map((s) => s.trim()).filter(Boolean) : [],
      correctAnswer: q.correctAnswer,
    })),
  }));
}

export function deserializeGroups(
  groups: {
    groupLabel?: string;
    questionType: string;
    instructions: string;
    startQuestion: number;
    endQuestion: number;
    matchingOptions?: { letter: string; text: string }[];
    completionTemplate?: string;
    imageUrl?: string;
    wordLimit?: string;
    questions: { questionNumber: number; questionText?: string; options?: string[]; correctAnswer: string | string[] }[];
  }[]
): QuestionGroupForm[] {
  return (groups || []).map((g) => ({
    groupLabel: g.groupLabel || "",
    questionType: g.questionType,
    instructions: g.instructions,
    startQuestion: String(g.startQuestion),
    endQuestion: String(g.endQuestion),
    matchingOptions: (g.matchingOptions || []).map((o) => `${o.letter} ${o.text}`).join("\n"),
    completionTemplate: g.completionTemplate || "",
    imageUrl: g.imageUrl || "",
    wordLimit: g.wordLimit || "",
    questions: g.questions.map((q) => ({
      questionNumber: q.questionNumber,
      questionText: q.questionText || "",
      options: Array.isArray(q.options) ? q.options.join(", ") : "",
      correctAnswer: Array.isArray(q.correctAnswer) ? q.correctAnswer.join(", ") : q.correctAnswer || "",
    })),
    collapsed: true,
  }));
}

/* ── Component ────────────────────────────────────────────────── */

interface QuestionGroupBuilderProps {
  groups: QuestionGroupForm[];
  setGroups: React.Dispatch<React.SetStateAction<QuestionGroupForm[]>>;
}

export default function QuestionGroupBuilder({ groups, setGroups }: QuestionGroupBuilderProps) {
  const updateGroup = (idx: number, patch: Partial<QuestionGroupForm>) => {
    setGroups((prev) => prev.map((g, i) => (i === idx ? { ...g, ...patch } : g)));
  };

  const removeGroup = (idx: number) => {
    setGroups((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleRangeChange = (idx: number, field: "startQuestion" | "endQuestion", val: string) => {
    const group = groups[idx];
    const updated = { ...group, [field]: val };
    const start = parseInt(field === "startQuestion" ? val : group.startQuestion);
    const end = parseInt(field === "endQuestion" ? val : group.endQuestion);
    if (!isNaN(start) && !isNaN(end) && start > 0 && end >= start && end - start < 50) {
      updated.questions = generateQuestions(start, end);
      updated.groupLabel = `Questions ${start}-${end}`;
    }
    setGroups((prev) => prev.map((g, i) => (i === idx ? updated : g)));
  };

  const updateQuestion = (gIdx: number, qIdx: number, field: keyof QuestionForm, val: string) => {
    setGroups((prev) =>
      prev.map((g, i) => {
        if (i !== gIdx) return g;
        const qs = g.questions.map((q, j) =>
          j === qIdx ? { ...q, [field]: field === "questionNumber" ? Number(val) : val } : q
        );
        return { ...g, questions: qs };
      })
    );
  };

  const removeQuestion = (gIdx: number, qIdx: number) => {
    setGroups((prev) =>
      prev.map((g, i) => (i !== gIdx ? g : { ...g, questions: g.questions.filter((_, j) => j !== qIdx) }))
    );
  };

  const addQuestion = (gIdx: number) => {
    setGroups((prev) =>
      prev.map((g, i) => {
        if (i !== gIdx) return g;
        const lastNum = g.questions.length > 0 ? g.questions[g.questions.length - 1].questionNumber : 0;
        return { ...g, questions: [...g.questions, { questionNumber: lastNum + 1, questionText: "", options: "", correctAnswer: "" }] };
      })
    );
  };

  return (
    <>
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-[#F8FAFC]">Question Groups ({groups.length})</span>
        <button
          type="button"
          onClick={() => setGroups([...groups, makeEmptyGroup()])}
          className="inline-flex cursor-pointer items-center gap-1 text-sm text-[#6366F1] hover:text-[#818CF8]"
        >
          <Plus size={14} strokeWidth={1.75} /> Add Group
        </button>
      </div>

      {groups.map((group, gIdx) => {
        const t = group.questionType;
        const showMatching = MATCHING_TYPES.includes(t);
        const showTemplate = COMPLETION_TYPES.includes(t);
        const showQuestionText = TEXT_QUESTION_TYPES.includes(t);
        const showOptions = t === "MULTIPLE_CHOICE" || t === "MULTIPLE_SELECT";
        const showImage = t === "DIAGRAM_LABELLING" || t === "MAP_LABELLING";
        const showWordLimit = COMPLETION_TYPES.includes(t) || t === "SHORT_ANSWER";

        return (
          <div key={gIdx} className="rounded-xl border-[0.5px] border-[#2A3150] bg-[#1E2540]">
            <button
              type="button"
              onClick={() => updateGroup(gIdx, { collapsed: !group.collapsed })}
              className="flex w-full cursor-pointer items-center justify-between px-4 py-3"
            >
              <span className="text-sm font-medium text-[#F8FAFC]">
                {group.groupLabel || `Group ${gIdx + 1}`}
                <span className="ml-2 text-xs text-[#64748B]">{t} ({group.questions.length} Qs)</span>
              </span>
              <div className="flex items-center gap-2">
                <span
                  onClick={(e) => { e.stopPropagation(); removeGroup(gIdx); }}
                  className="text-[#64748B] hover:text-[#EF4444]"
                >
                  <Trash2 size={14} strokeWidth={1.75} />
                </span>
                {group.collapsed ? <ChevronDown size={16} className="text-[#64748B]" /> : <ChevronUp size={16} className="text-[#64748B]" />}
              </div>
            </button>

            {!group.collapsed && (
              <div className="flex flex-col gap-3 border-t border-[#2A3150] px-4 pb-4 pt-3">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <input placeholder="Group label" value={group.groupLabel} onChange={(e) => updateGroup(gIdx, { groupLabel: e.target.value })} className={inputCls} />
                  <select value={group.questionType} onChange={(e) => updateGroup(gIdx, { questionType: e.target.value })} className={inputCls}>
                    {QUESTION_TYPES.map((qt) => <option key={qt} value={qt}>{qt}</option>)}
                  </select>
                </div>

                <textarea placeholder="Instructions" rows={2} value={group.instructions} onChange={(e) => updateGroup(gIdx, { instructions: e.target.value })} className={inputCls} />

                <div className="grid grid-cols-2 gap-3">
                  <input type="number" placeholder="Start Q#" value={group.startQuestion} onChange={(e) => handleRangeChange(gIdx, "startQuestion", e.target.value)} className={inputCls} />
                  <input type="number" placeholder="End Q#" value={group.endQuestion} onChange={(e) => handleRangeChange(gIdx, "endQuestion", e.target.value)} className={inputCls} />
                </div>

                {showMatching && (
                  <textarea
                    placeholder="Options (one per line, e.g. A The history of...)"
                    rows={4}
                    value={group.matchingOptions}
                    onChange={(e) => updateGroup(gIdx, { matchingOptions: e.target.value })}
                    className={inputCls}
                  />
                )}

                {showTemplate && (
                  <TemplateEditor
                    value={group.completionTemplate}
                    onChange={(val) => updateGroup(gIdx, { completionTemplate: val })}
                    startQuestion={Number(group.startQuestion) || 0}
                    endQuestion={Number(group.endQuestion) || 0}
                  />
                )}

                {showWordLimit && (
                  <input placeholder="Word limit (e.g. NO MORE THAN THREE WORDS)" value={group.wordLimit} onChange={(e) => updateGroup(gIdx, { wordLimit: e.target.value })} className={inputCls} />
                )}

                {showImage && (
                  <FileUpload
                    value={group.imageUrl}
                    onChange={(url) => updateGroup(gIdx, { imageUrl: url })}
                    accept="image/*"
                    endpoint="/api/admin/upload-image"
                    folder="ieltsbuddy/diagrams"
                    label="Diagram image"
                  />
                )}

                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-[#94A3B8]">Questions ({group.questions.length})</span>
                  <button type="button" onClick={() => addQuestion(gIdx)} className="inline-flex cursor-pointer items-center gap-1 text-xs text-[#6366F1] hover:text-[#818CF8]">
                    <Plus size={12} strokeWidth={1.75} /> Add Question
                  </button>
                </div>

                {group.questions.map((q, qIdx) => (
                  <div key={qIdx} className="flex flex-col gap-2 rounded-lg border-[0.5px] border-[#2A3150] bg-[#12172B] p-2 sm:flex-row sm:items-center">
                    <div className="flex items-center gap-2">
                      <span className="w-10 flex-shrink-0 text-center text-xs font-medium text-[#94A3B8]">Q{q.questionNumber}</span>
                      <button type="button" onClick={() => removeQuestion(gIdx, qIdx)} className="cursor-pointer text-[#64748B] hover:text-[#EF4444] sm:hidden">
                        <Trash2 size={14} strokeWidth={1.75} />
                      </button>
                    </div>
                    {showQuestionText && (
                      <input placeholder="Question text" value={q.questionText} onChange={(e) => updateQuestion(gIdx, qIdx, "questionText", e.target.value)} className={`${inputCls} flex-1`} />
                    )}
                    {showOptions && (
                      <input placeholder="Options (comma sep)" value={q.options} onChange={(e) => updateQuestion(gIdx, qIdx, "options", e.target.value)} className={`${inputCls} flex-1`} />
                    )}
                    <input placeholder="Correct answer" value={q.correctAnswer} onChange={(e) => updateQuestion(gIdx, qIdx, "correctAnswer", e.target.value)} className={`${inputCls} flex-1`} />
                    <button type="button" onClick={() => removeQuestion(gIdx, qIdx)} className="hidden cursor-pointer text-[#64748B] hover:text-[#EF4444] sm:block">
                      <Trash2 size={14} strokeWidth={1.75} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </>
  );
}

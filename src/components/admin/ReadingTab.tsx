"use client";

import { useState, useEffect } from "react";
import { Trash2, Plus, ChevronDown, ChevronUp } from "lucide-react";

/* ── Question types ─────────────────────────────────────────────── */

const questionTypes = [
  "true-false-not-given",
  "yes-no-not-given",
  "multiple-choice",
  "matching-headings",
  "matching-information",
  "matching-features",
  "matching-sentence-endings",
  "sentence-completion",
  "summary-completion",
  "note-completion",
  "table-completion",
  "diagram-label-completion",
  "short-answer",
] as const;

type QuestionType = (typeof questionTypes)[number];

/* ── Helper sets for conditional fields ─────────────────────────── */

const matchingTypes: QuestionType[] = [
  "matching-headings",
  "matching-information",
  "matching-features",
  "matching-sentence-endings",
];

const completionTypes: QuestionType[] = [
  "summary-completion",
  "note-completion",
  "table-completion",
  "diagram-label-completion",
];

const needsQuestionText: QuestionType[] = [
  "true-false-not-given",
  "yes-no-not-given",
  "multiple-choice",
  "matching-information",
  "matching-features",
  "short-answer",
];

const needsOptions: QuestionType[] = ["multiple-choice"];

/* ── Form types ─────────────────────────────────────────────────── */

interface QuestionForm {
  questionNumber: number;
  questionText: string;
  options: string;
  correctAnswer: string;
}

interface QuestionGroupForm {
  groupLabel: string;
  questionType: QuestionType;
  instructions: string;
  startQuestion: string;
  endQuestion: string;
  matchingOptions: string;
  completionTemplate: string;
  diagramImageUrl: string;
  wordLimit: string;
  questions: QuestionForm[];
  collapsed: boolean;
}

interface ReadingItem {
  _id: string;
  bookNumber: number;
  testNumber: number;
  passageNumber: number;
  title: string;
  questionGroups?: { questions: { questionNumber: number }[] }[];
}

interface ReadingTabProps {
  onToast: (msg: string, type: "success" | "error") => void;
}

/* ── Helpers ─────────────────────────────────────────────────────── */

function makeEmptyGroup(): QuestionGroupForm {
  return {
    groupLabel: "",
    questionType: "true-false-not-given",
    instructions: "",
    startQuestion: "",
    endQuestion: "",
    matchingOptions: "",
    completionTemplate: "",
    diagramImageUrl: "",
    wordLimit: "",
    questions: [],
    collapsed: false,
  };
}

function generateQuestions(start: number, end: number): QuestionForm[] {
  const qs: QuestionForm[] = [];
  for (let i = start; i <= end; i++) {
    qs.push({ questionNumber: i, questionText: "", options: "", correctAnswer: "" });
  }
  return qs;
}

function totalQuestions(item: ReadingItem): number {
  if (!item.questionGroups) return 0;
  return item.questionGroups.reduce((sum, g) => sum + g.questions.length, 0);
}

/* ── Component ──────────────────────────────────────────────────── */

export default function ReadingTab({ onToast }: ReadingTabProps) {
  const [items, setItems] = useState<ReadingItem[]>([]);
  const [form, setForm] = useState({
    bookNumber: "",
    testNumber: "",
    passageNumber: "1",
    title: "",
    topic: "",
    difficulty: "beginner",
    passage: "",
  });
  const [groups, setGroups] = useState<QuestionGroupForm[]>([]);

  const fetchItems = async () => {
    const r = await fetch("/api/admin/reading");
    if (r.ok) setItems(await r.json());
  };
  useEffect(() => {
    fetchItems();
  }, []);

  /* ── Group helpers ──────────────────────────────────────────── */

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
      prev.map((g, i) => {
        if (i !== gIdx) return g;
        return { ...g, questions: g.questions.filter((_, j) => j !== qIdx) };
      })
    );
  };

  const addQuestion = (gIdx: number) => {
    setGroups((prev) =>
      prev.map((g, i) => {
        if (i !== gIdx) return g;
        const lastNum = g.questions.length > 0 ? g.questions[g.questions.length - 1].questionNumber : 0;
        return {
          ...g,
          questions: [...g.questions, { questionNumber: lastNum + 1, questionText: "", options: "", correctAnswer: "" }],
        };
      })
    );
  };

  /* ── Submit ─────────────────────────────────────────────────── */

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      bookNumber: Number(form.bookNumber),
      testNumber: Number(form.testNumber),
      passageNumber: Number(form.passageNumber),
      title: form.title,
      topic: form.topic,
      difficulty: form.difficulty,
      passage: form.passage,
      questionGroups: groups.map((g) => ({
        groupLabel: g.groupLabel,
        questionType: g.questionType,
        instructions: g.instructions,
        startQuestion: Number(g.startQuestion),
        endQuestion: Number(g.endQuestion),
        matchingOptions: g.matchingOptions
          ? g.matchingOptions.split("\n").map((s) => s.trim()).filter(Boolean)
          : [],
        completionTemplate: g.completionTemplate || undefined,
        diagramImageUrl: g.diagramImageUrl || undefined,
        wordLimit: g.wordLimit || undefined,
        questions: g.questions.map((q) => ({
          questionNumber: q.questionNumber,
          questionText: q.questionText,
          options: q.options ? q.options.split(",").map((s) => s.trim()).filter(Boolean) : [],
          correctAnswer: q.correctAnswer,
        })),
      })),
    };

    const res = await fetch("/api/admin/reading", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      onToast("Reading passage added", "success");
      setForm({ bookNumber: "", testNumber: "", passageNumber: "1", title: "", topic: "", difficulty: "beginner", passage: "" });
      setGroups([]);
      fetchItems();
    } else {
      const d = await res.json();
      onToast(d.error || "Failed", "error");
    }
  };

  const handleDelete = async (id: string) => {
    const r = await fetch(`/api/admin/reading/${id}`, { method: "DELETE" });
    if (r.ok) {
      onToast("Deleted", "success");
      fetchItems();
    } else {
      onToast("Failed", "error");
    }
  };

  /* ── Styles ─────────────────────────────────────────────────── */

  const inputCls =
    "w-full rounded-lg border-[0.5px] border-[#2A3150] bg-[#12172B] px-3 py-2 text-sm text-[#F8FAFC] outline-none focus:border-[#6366F1]";

  /* ── Render ─────────────────────────────────────────────────── */

  return (
    <div>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        {/* Passage metadata */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <input type="number" placeholder="Book #" required value={form.bookNumber} onChange={(e) => setForm({ ...form, bookNumber: e.target.value })} className={inputCls} />
          <input type="number" placeholder="Test #" required value={form.testNumber} onChange={(e) => setForm({ ...form, testNumber: e.target.value })} className={inputCls} />
          <select value={form.passageNumber} onChange={(e) => setForm({ ...form, passageNumber: e.target.value })} className={inputCls}>
            <option value="1">Passage 1</option>
            <option value="2">Passage 2</option>
            <option value="3">Passage 3</option>
          </select>
          <select value={form.difficulty} onChange={(e) => setForm({ ...form, difficulty: e.target.value })} className={inputCls}>
            <option value="beginner">Beginner</option>
            <option value="intermediate">Intermediate</option>
            <option value="advanced">Advanced</option>
          </select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <input placeholder="Title" required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className={inputCls} />
          <input placeholder="Topic" required value={form.topic} onChange={(e) => setForm({ ...form, topic: e.target.value })} className={inputCls} />
        </div>

        <textarea placeholder="Full passage text" required rows={6} value={form.passage} onChange={(e) => setForm({ ...form, passage: e.target.value })} className={inputCls} />

        {/* Question Groups header */}
        <div className="mt-4 flex items-center justify-between">
          <span className="text-sm font-medium text-[#F8FAFC]">
            Question Groups ({groups.length})
          </span>
          <button
            type="button"
            onClick={() => setGroups([...groups, makeEmptyGroup()])}
            className="inline-flex cursor-pointer items-center gap-1 text-sm text-[#6366F1] hover:text-[#818CF8]"
          >
            <Plus size={14} strokeWidth={1.75} /> Add Question Group
          </button>
        </div>

        {/* Question Group cards */}
        {groups.map((group, gIdx) => {
          const qType = group.questionType;
          const showMatchingOptions = matchingTypes.includes(qType);
          const showCompletionTemplate = completionTypes.includes(qType) || qType === "sentence-completion";
          const showQuestionText = needsQuestionText.includes(qType);
          const showOptions = needsOptions.includes(qType);
          const isMatchingHeadings = qType === "matching-headings";
          const isSentenceEndings = qType === "matching-sentence-endings";

          return (
            <div key={gIdx} className="rounded-xl border-[0.5px] border-[#2A3150] bg-[#1E2540]">
              {/* Group header — collapsible */}
              <button
                type="button"
                onClick={() => updateGroup(gIdx, { collapsed: !group.collapsed })}
                className="flex w-full cursor-pointer items-center justify-between px-4 py-3"
              >
                <span className="text-sm font-medium text-[#F8FAFC]">
                  {group.groupLabel || `Group ${gIdx + 1}`}
                  <span className="ml-2 text-xs text-[#64748B]">
                    {qType} ({group.questions.length} Qs)
                  </span>
                </span>
                <div className="flex items-center gap-2">
                  <span
                    onClick={(e) => {
                      e.stopPropagation();
                      removeGroup(gIdx);
                    }}
                    className="text-[#64748B] hover:text-[#EF4444]"
                  >
                    <Trash2 size={14} strokeWidth={1.75} />
                  </span>
                  {group.collapsed ? (
                    <ChevronDown size={16} strokeWidth={1.75} className="text-[#64748B]" />
                  ) : (
                    <ChevronUp size={16} strokeWidth={1.75} className="text-[#64748B]" />
                  )}
                </div>
              </button>

              {/* Group body */}
              {!group.collapsed && (
                <div className="flex flex-col gap-3 border-t border-[#2A3150] px-4 pb-4 pt-3">
                  {/* Row 1: label, type */}
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <input
                      placeholder="Group label (e.g. Questions 1-6)"
                      value={group.groupLabel}
                      onChange={(e) => updateGroup(gIdx, { groupLabel: e.target.value })}
                      className={inputCls}
                    />
                    <select
                      value={group.questionType}
                      onChange={(e) => updateGroup(gIdx, { questionType: e.target.value as QuestionType })}
                      className={inputCls}
                    >
                      {questionTypes.map((t) => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  </div>

                  {/* Instructions */}
                  <textarea
                    placeholder="Instructions (e.g. Do the following statements agree with the information...)"
                    rows={2}
                    value={group.instructions}
                    onChange={(e) => updateGroup(gIdx, { instructions: e.target.value })}
                    className={inputCls}
                  />

                  {/* Start / End question numbers */}
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      type="number"
                      placeholder="Start Q#"
                      value={group.startQuestion}
                      onChange={(e) => handleRangeChange(gIdx, "startQuestion", e.target.value)}
                      className={inputCls}
                    />
                    <input
                      type="number"
                      placeholder="End Q#"
                      value={group.endQuestion}
                      onChange={(e) => handleRangeChange(gIdx, "endQuestion", e.target.value)}
                      className={inputCls}
                    />
                  </div>

                  {/* Conditional: Matching options */}
                  {showMatchingOptions && (
                    <textarea
                      placeholder={
                        isMatchingHeadings
                          ? "Headings list (one per line)"
                          : isSentenceEndings
                            ? "Sentence endings (one per line)"
                            : "Options list (one per line)"
                      }
                      rows={4}
                      value={group.matchingOptions}
                      onChange={(e) => updateGroup(gIdx, { matchingOptions: e.target.value })}
                      className={inputCls}
                    />
                  )}

                  {/* Conditional: Completion template */}
                  {showCompletionTemplate && (
                    <textarea
                      placeholder="Template text with blanks marked as (7), (8) etc."
                      rows={4}
                      value={group.completionTemplate}
                      onChange={(e) => updateGroup(gIdx, { completionTemplate: e.target.value })}
                      className={inputCls}
                    />
                  )}

                  {/* Word limit */}
                  {(completionTypes.includes(qType) || qType === "sentence-completion" || qType === "short-answer") && (
                    <input
                      placeholder="Word limit (e.g. NO MORE THAN THREE WORDS)"
                      value={group.wordLimit}
                      onChange={(e) => updateGroup(gIdx, { wordLimit: e.target.value })}
                      className={inputCls}
                    />
                  )}

                  {/* Diagram image upload */}
                  {qType === "diagram-label-completion" && (
                    <div className="flex items-center gap-3">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          const fd = new FormData();
                          fd.append("file", file);
                          fd.append("folder", "ieltsbuddy/diagrams");
                          const res = await fetch("/api/admin/upload-image", { method: "POST", body: fd });
                          if (res.ok) {
                            const { url } = await res.json();
                            updateGroup(gIdx, { diagramImageUrl: url });
                          }
                        }}
                        className="text-sm text-[#94A3B8]"
                      />
                      {group.diagramImageUrl && (
                        <span className="truncate text-xs text-[#22C55E]">Uploaded</span>
                      )}
                    </div>
                  )}

                  {/* Questions within group */}
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-[#94A3B8]">
                      Questions ({group.questions.length})
                    </span>
                    <button
                      type="button"
                      onClick={() => addQuestion(gIdx)}
                      className="inline-flex cursor-pointer items-center gap-1 text-xs text-[#6366F1] hover:text-[#818CF8]"
                    >
                      <Plus size={12} strokeWidth={1.75} /> Add Question
                    </button>
                  </div>

                  {group.questions.map((q, qIdx) => (
                    <div
                      key={qIdx}
                      className="grid grid-cols-[auto_1fr_1fr_auto] items-center gap-2 rounded-lg border-[0.5px] border-[#2A3150] bg-[#12172B] p-2 sm:grid-cols-[60px_1fr_1fr_1fr_auto]"
                    >
                      {/* Q number */}
                      <span className="text-center text-xs font-medium text-[#94A3B8]">
                        Q{q.questionNumber}
                      </span>

                      {/* Question text — shown for types that need it */}
                      {showQuestionText && (
                        <input
                          placeholder={
                            isMatchingHeadings
                              ? `Paragraph ${qIdx + 1}`
                              : "Question text"
                          }
                          value={q.questionText}
                          onChange={(e) => updateQuestion(gIdx, qIdx, "questionText", e.target.value)}
                          className={inputCls}
                        />
                      )}

                      {/* MCQ options */}
                      {showOptions && (
                        <input
                          placeholder="Options (comma sep)"
                          value={q.options}
                          onChange={(e) => updateQuestion(gIdx, qIdx, "options", e.target.value)}
                          className={inputCls}
                        />
                      )}

                      {/* Correct answer */}
                      <input
                        placeholder="Correct answer"
                        value={q.correctAnswer}
                        onChange={(e) => updateQuestion(gIdx, qIdx, "correctAnswer", e.target.value)}
                        className={inputCls}
                      />

                      {/* Delete question */}
                      <button
                        type="button"
                        onClick={() => removeQuestion(gIdx, qIdx)}
                        className="cursor-pointer text-[#64748B] hover:text-[#EF4444]"
                      >
                        <Trash2 size={14} strokeWidth={1.75} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}

        <button
          type="submit"
          className="mt-2 cursor-pointer rounded-lg bg-[#6366F1] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#818CF8]"
        >
          Save Reading Passage
        </button>
      </form>

      {/* Saved items list */}
      <div className="mt-6 flex flex-col gap-2">
        {items.map((item) => (
          <div key={item._id} className="flex items-center justify-between rounded-lg border-[0.5px] border-[#2A3150] bg-[#1E2540] px-4 py-3">
            <div className="min-w-0">
              <p className="text-sm font-medium text-[#F8FAFC]">{item.title}</p>
              <p className="text-xs text-[#64748B]">
                Book {item.bookNumber} - Test {item.testNumber} - Passage {item.passageNumber} - {totalQuestions(item)} Qs
              </p>
            </div>
            <button
              onClick={() => handleDelete(item._id)}
              className="cursor-pointer text-[#64748B] transition-colors hover:text-[#EF4444]"
            >
              <Trash2 size={16} strokeWidth={1.75} />
            </button>
          </div>
        ))}
        {items.length === 0 && (
          <p className="py-4 text-center text-sm text-[#64748B]">No reading passages yet</p>
        )}
      </div>
    </div>
  );
}

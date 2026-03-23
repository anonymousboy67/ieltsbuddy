import mongoose, { Schema, type Document } from "mongoose";

/* ── Question types ─────────────────────────────────────────── */

export const QUESTION_TYPES = [
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

export type QuestionType = (typeof QUESTION_TYPES)[number];

/* ── TypeScript interfaces ──────────────────────────────────── */

export interface IQuestion {
  questionNumber: number;
  questionText: string;
  /** MCQ / matching dropdown options */
  options?: string[];
  correctAnswer: string;
  /** For matching-sentence-endings: the sentence stem */
  sentenceStem?: string;
  /** Explanation shown after grading */
  explanation?: string;
}

export interface IQuestionGroup {
  groupLabel: string;
  questionType: QuestionType;
  instructions: string;
  startQuestion: number;
  endQuestion: number;

  /* ── type-specific optional fields ──────────────────────── */

  /** matching-headings / matching-information / matching-features / matching-sentence-endings */
  matchingOptions?: string[];
  /** summary-completion / note-completion / table-completion / sentence-completion */
  completionTemplate?: string;
  /** diagram-label-completion — Cloudinary URL */
  diagramImageUrl?: string;
  /** Word-limit hint shown to student, e.g. "NO MORE THAN THREE WORDS" */
  wordLimit?: string;

  questions: IQuestion[];
}

export interface IReadingSection extends Document {
  bookNumber: number;
  testNumber: number;
  partNumber: number;
  title: string;
  topic: string;
  difficulty: "beginner" | "intermediate" | "advanced";
  passage: string;
  questionGroups: IQuestionGroup[];
  /** Optional Cloudinary URL for passage-level images (maps, charts, etc.) */
  imageUrl?: string;
  createdAt: Date;
}

/* ── Mongoose schemas ───────────────────────────────────────── */

const QuestionSchema = new Schema<IQuestion>(
  {
    questionNumber: { type: Number, required: true },
    questionText: { type: String, default: "" },
    options: [{ type: String }],
    correctAnswer: { type: String, required: true },
    sentenceStem: { type: String },
    explanation: { type: String },
  },
  { _id: false }
);

const QuestionGroupSchema = new Schema<IQuestionGroup>(
  {
    groupLabel: { type: String, required: true },
    questionType: {
      type: String,
      enum: QUESTION_TYPES,
      required: true,
    },
    instructions: { type: String, default: "" },
    startQuestion: { type: Number, required: true },
    endQuestion: { type: Number, required: true },
    matchingOptions: [{ type: String }],
    completionTemplate: { type: String },
    diagramImageUrl: { type: String },
    wordLimit: { type: String },
    questions: [QuestionSchema],
  },
  { _id: false }
);

const ReadingSectionSchema = new Schema<IReadingSection>({
  bookNumber: { type: Number, required: true, index: true },
  testNumber: { type: Number, required: true, index: true },
  partNumber: { type: Number, required: true, min: 1, max: 3 },
  title: { type: String, required: true },
  topic: { type: String, required: true },
  difficulty: {
    type: String,
    enum: ["beginner", "intermediate", "advanced"],
    required: true,
  },
  passage: { type: String, required: true },
  questionGroups: [QuestionGroupSchema],
  imageUrl: { type: String },
  createdAt: { type: Date, default: Date.now },
});

ReadingSectionSchema.index({ bookNumber: 1, testNumber: 1, partNumber: 1 });

export default mongoose.models.ReadingSection ||
  mongoose.model<IReadingSection>("ReadingSection", ReadingSectionSchema);

import mongoose, { Schema, type Document } from "mongoose";
import { QuestionType } from "@/types/ielts";
import type { IReadingSection } from "@/types/ielts";
import { getContentConnection } from "@/lib/mongodb-connections";

const QuestionSchema = new Schema(
  {
    questionNumber: { type: Number, required: true },
    questionText: { type: String },
    options: [String],
    correctAnswer: { type: Schema.Types.Mixed, required: true },
  },
  { _id: false }
);

const MatchingOptionSchema = new Schema(
  {
    letter: { type: String },
    text: { type: String },
  },
  { _id: false }
);

const QuestionGroupSchema = new Schema(
  {
    groupLabel: { type: String },
    questionType: {
      type: String,
      enum: Object.values(QuestionType),
      required: true,
    },
    instructions: { type: String, required: true },
    wordLimit: { type: String },
    startQuestion: { type: Number, required: true },
    endQuestion: { type: Number, required: true },
    matchingOptions: [MatchingOptionSchema],
    completionTemplate: { type: String },
    tableData: {
      headers: [String],
      rows: [Schema.Types.Mixed],
    },
    wordBank: [String],
    imageUrl: { type: String },
    sectionLabels: [String],
    allowRepeat: { type: Boolean, default: false },
    questions: [QuestionSchema],
  },
  { _id: false }
);

const PassageSectionSchema = new Schema(
  {
    label: { type: String },
    text: { type: String },
  },
  { _id: false }
);

export interface IReadingSectionDoc extends Omit<IReadingSection, "questionGroups">, Document {}

const ReadingSectionSchema = new Schema(
  {
    bookNumber: { type: Number, required: true },
    testNumber: { type: Number, required: true },
    passageNumber: { type: Number, required: true },
    title: { type: String, required: true },
    subtitle: { type: String },
    passage: { type: String, required: true },
    passageSections: [PassageSectionSchema],
    topic: { type: String },
    difficulty: {
      type: String,
      enum: ["beginner", "intermediate", "advanced"],
    },
    totalQuestions: { type: Number, required: true },
    questionGroups: [QuestionGroupSchema],
    footnotes: [String],
  },
  { timestamps: true }
);

ReadingSectionSchema.index(
  { bookNumber: 1, testNumber: 1, passageNumber: 1 },
  { unique: true }
);

const contentConnection = getContentConnection();

export default (contentConnection.models.ReadingSection as mongoose.Model<IReadingSectionDoc>) ||
  contentConnection.model<IReadingSectionDoc>("ReadingSection", ReadingSectionSchema);

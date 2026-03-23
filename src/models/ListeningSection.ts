import mongoose, { Schema, type Document } from "mongoose";
import { QuestionType } from "@/types/ielts";
import type { IListeningSection } from "@/types/ielts";

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

export interface IListeningSectionDoc extends Omit<IListeningSection, "questionGroups">, Document {}

const ListeningSectionSchema = new Schema(
  {
    bookNumber: { type: Number, required: true },
    testNumber: { type: Number, required: true },
    partNumber: { type: Number, required: true },
    title: { type: String },
    audioUrl: { type: String },
    transcript: { type: String },
    context: { type: String },
    totalQuestions: { type: Number, required: true },
    questionGroups: [QuestionGroupSchema],
  },
  { timestamps: true }
);

ListeningSectionSchema.index(
  { bookNumber: 1, testNumber: 1, partNumber: 1 },
  { unique: true }
);

export default mongoose.models.ListeningSection ||
  mongoose.model<IListeningSectionDoc>("ListeningSection", ListeningSectionSchema);

import mongoose, { Schema, type Document } from "mongoose";
import { WritingTaskType, VisualType } from "@/types/ielts";
import type { IWritingTask } from "@/types/ielts";

const SampleAnswerSchema = new Schema(
  {
    bandScore: { type: Number },
    essay: { type: String },
    examinerComments: { type: String },
    criteriaBreakdown: {
      taskAchievement: { type: String },
      coherenceCohesion: { type: String },
      lexicalResource: { type: String },
      grammaticalRange: { type: String },
    },
  },
  { _id: false }
);

const WritingTableDataSchema = new Schema(
  {
    title: { type: String },
    headers: [String],
    rows: [[String]],
  },
  { _id: false }
);

export interface IWritingTaskDoc extends Omit<IWritingTask, "tableData" | "sampleAnswers">, Document {}

const WritingTaskSchema = new Schema(
  {
    bookNumber: { type: Number, required: true },
    testNumber: { type: Number, required: true },
    taskNumber: { type: Number, required: true },
    taskType: {
      type: String,
      enum: Object.values(WritingTaskType),
      required: true,
    },
    prompt: { type: String, required: true },
    instructions: { type: String, required: true },
    minWords: { type: Number, required: true },
    timeRecommended: { type: Number, required: true },
    visualType: {
      type: String,
      enum: Object.values(VisualType),
    },
    imageUrl: { type: String },
    tableData: [WritingTableDataSchema],
    sampleAnswers: [SampleAnswerSchema],
  },
  { timestamps: true }
);

WritingTaskSchema.index(
  { bookNumber: 1, testNumber: 1, taskNumber: 1 },
  { unique: true }
);

export default mongoose.models.WritingTask ||
  mongoose.model<IWritingTaskDoc>("WritingTask", WritingTaskSchema);

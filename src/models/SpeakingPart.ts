import mongoose, { Schema, type Document } from "mongoose";
import { SpeakingPartType } from "@/types/ielts";
import type { ISpeakingPart } from "@/types/ielts";

const SpeakingQuestionSchema = new Schema(
  {
    questionNumber: { type: Number },
    questionText: { type: String },
  },
  { _id: false }
);

const SpeakingSampleAnswerSchema = new Schema(
  {
    questionNumber: { type: Number },
    answerText: { type: String },
  },
  { _id: false }
);

export interface ISpeakingPartDoc extends Omit<ISpeakingPart, "questions" | "sampleAnswers">, Document {}

const SpeakingPartSchema = new Schema(
  {
    bookNumber: { type: Number, required: true },
    testNumber: { type: Number, required: true },
    partNumber: { type: Number, required: true },
    partType: {
      type: String,
      enum: Object.values(SpeakingPartType),
      required: true,
    },
    topic: { type: String },
    instructions: { type: String },
    questions: [SpeakingQuestionSchema],
    cueCardPrompts: [String],
    cueCardFinalPrompt: { type: String },
    prepTime: { type: Number, default: 60 },
    speakTime: { type: Number, default: 120 },
    sampleAnswers: [SpeakingSampleAnswerSchema],
  },
  { timestamps: true }
);

SpeakingPartSchema.index(
  { bookNumber: 1, testNumber: 1, partNumber: 1 },
  { unique: true }
);

export default mongoose.models.SpeakingPart ||
  mongoose.model<ISpeakingPartDoc>("SpeakingPart", SpeakingPartSchema);

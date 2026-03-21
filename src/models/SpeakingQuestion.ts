import mongoose, { Schema, type Document } from "mongoose";

export interface ISpeakingQuestion extends Document {
  bookNumber: number;
  testNumber: number;
  partNumber: number;
  questions: string[];
  topicCard?: string;
  createdAt: Date;
}

const SpeakingQuestionSchema = new Schema<ISpeakingQuestion>({
  bookNumber: { type: Number, required: true },
  testNumber: { type: Number, required: true },
  partNumber: { type: Number, required: true, min: 1, max: 3 },
  questions: [{ type: String, required: true }],
  topicCard: { type: String },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.models.SpeakingQuestion ||
  mongoose.model<ISpeakingQuestion>("SpeakingQuestion", SpeakingQuestionSchema);

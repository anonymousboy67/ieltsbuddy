import mongoose, { Schema, type Document } from "mongoose";
import { getContentConnection } from "@/lib/mongodb-connections";

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

const contentConnection = getContentConnection();

export default (contentConnection.models.SpeakingQuestion as mongoose.Model<ISpeakingQuestion>) ||
  contentConnection.model<ISpeakingQuestion>("SpeakingQuestion", SpeakingQuestionSchema);

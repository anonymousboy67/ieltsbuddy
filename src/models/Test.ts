import mongoose, { Schema, type Document } from "mongoose";

export interface ITestDoc extends Document {
  bookNumber: number;
  testNumber: number;
  bookTitle?: string;
  listening: mongoose.Types.ObjectId[];
  reading: mongoose.Types.ObjectId[];
  writing: mongoose.Types.ObjectId[];
  speaking: mongoose.Types.ObjectId[];
  isComplete: boolean;
}

const TestSchema = new Schema(
  {
    bookNumber: { type: Number, required: true },
    testNumber: { type: Number, required: true },
    bookTitle: { type: String },
    listening: [{ type: Schema.Types.ObjectId, ref: "ListeningSection" }],
    reading: [{ type: Schema.Types.ObjectId, ref: "ReadingSection" }],
    writing: [{ type: Schema.Types.ObjectId, ref: "WritingTask" }],
    speaking: [{ type: Schema.Types.ObjectId, ref: "SpeakingPart" }],
    isComplete: { type: Boolean, default: false },
  },
  { timestamps: true }
);

TestSchema.index({ bookNumber: 1, testNumber: 1 }, { unique: true });

export default mongoose.models.Test ||
  mongoose.model<ITestDoc>("Test", TestSchema);

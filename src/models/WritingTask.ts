import mongoose, { Schema, type Document } from "mongoose";

export interface IWritingTask extends Document {
  bookNumber: number;
  testNumber: number;
  taskType: "task1" | "task2";
  title: string;
  instructions: string;
  imageUrl?: string;
  wordRequirement: number;
  timeMinutes: number;
  sampleAnswer?: string;
  createdAt: Date;
}

const WritingTaskSchema = new Schema<IWritingTask>({
  bookNumber: { type: Number, required: true },
  testNumber: { type: Number, required: true },
  taskType: { type: String, enum: ["task1", "task2"], required: true },
  title: { type: String, required: true },
  instructions: { type: String, required: true },
  imageUrl: { type: String },
  wordRequirement: { type: Number, default: 150 },
  timeMinutes: { type: Number, default: 20 },
  sampleAnswer: { type: String },
  createdAt: { type: Date, default: Date.now },
});

WritingTaskSchema.pre("save", function () {
  if (this.taskType === "task2") {
    if (this.wordRequirement === 150) this.wordRequirement = 250;
    if (this.timeMinutes === 20) this.timeMinutes = 40;
  }
});

export default mongoose.models.WritingTask ||
  mongoose.model<IWritingTask>("WritingTask", WritingTaskSchema);

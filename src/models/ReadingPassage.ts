import mongoose, { Schema, type Document } from "mongoose";

export interface IQuestion {
  questionNumber: number;
  questionType: string;
  questionText: string;
  options?: string[];
  correctAnswer: string;
}

export interface IReadingPassage extends Document {
  bookNumber: number;
  testNumber: number;
  partNumber: number;
  title: string;
  topic: string;
  difficulty: "beginner" | "intermediate" | "advanced";
  passage: string;
  questions: IQuestion[];
  createdAt: Date;
}

const QuestionSchema = new Schema<IQuestion>(
  {
    questionNumber: { type: Number, required: true },
    questionType: { type: String, required: true },
    questionText: { type: String, required: true },
    options: [{ type: String }],
    correctAnswer: { type: String, required: true },
  },
  { _id: false }
);

const ReadingPassageSchema = new Schema<IReadingPassage>({
  bookNumber: { type: Number, required: true },
  testNumber: { type: Number, required: true },
  partNumber: { type: Number, required: true, min: 1, max: 3 },
  title: { type: String, required: true },
  topic: { type: String, required: true },
  difficulty: {
    type: String,
    enum: ["beginner", "intermediate", "advanced"],
    required: true,
  },
  passage: { type: String, required: true },
  questions: [QuestionSchema],
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.models.ReadingPassage ||
  mongoose.model<IReadingPassage>("ReadingPassage", ReadingPassageSchema);

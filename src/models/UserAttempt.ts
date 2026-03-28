import mongoose, { Schema, type Document } from "mongoose";

export interface IUserAttemptDoc extends Document {
  userId: mongoose.Types.ObjectId;
  sectionType: "listening" | "reading" | "writing" | "speaking";
  sectionId: mongoose.Types.ObjectId;
  sectionModel: "ListeningSection" | "ReadingSection" | "WritingTask" | "SpeakingPart";
  bookNumber?: number;
  testNumber?: number;
  answers?: {
    questionNumber: number;
    userAnswer: unknown;
    correctAnswer: unknown;
    isCorrect: boolean;
  }[];
  correctCount?: number;
  totalQuestions?: number;
  bandScore?: number;
  writingResponse?: string;
  writingFeedback?: {
    bandScore: number;
    taskAchievement: { score: number; feedback: string };
    coherenceCohesion: { score: number; feedback: string };
    lexicalResource: { score: number; feedback: string };
    grammaticalRange: { score: number; feedback: string };
    overallFeedback: string;
  };
  speakingResponses?: {
    partNumber: number;
    questionNumber?: number;
    audioUrl?: string;
    transcript?: string;
  }[];
  speakingFeedback?: {
    bandScore: number;
    fluencyCoherence: { score: number; feedback: string };
    lexicalResource: { score: number; feedback: string };
    grammaticalRange: { score: number; feedback: string };
    pronunciation: { score: number; feedback: string };
    overallFeedback: string;
  };
  timeSpent?: number;
  completedAt?: Date;
  mode?: "practice" | "timed" | "review";
  status?: "pending" | "evaluating" | "completed" | "failed";
}

const AnswerSchema = new Schema(
  {
    questionNumber: { type: Number },
    userAnswer: { type: Schema.Types.Mixed },
    correctAnswer: { type: Schema.Types.Mixed },
    isCorrect: { type: Boolean },
  },
  { _id: false }
);

const FeedbackScoreSchema = new Schema(
  {
    score: { type: Number },
    feedback: { type: String },
  },
  { _id: false }
);

const UserAttemptSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    sectionType: {
      type: String,
      enum: ["listening", "reading", "writing", "speaking"],
      required: true,
    },
    sectionId: {
      type: Schema.Types.ObjectId,
      required: true,
      refPath: "sectionModel",
    },
    sectionModel: {
      type: String,
      enum: ["ListeningSection", "ReadingSection", "WritingTask", "SpeakingPart"],
      required: true,
    },
    bookNumber: { type: Number },
    testNumber: { type: Number },
    answers: [AnswerSchema],
    correctCount: { type: Number },
    totalQuestions: { type: Number },
    bandScore: { type: Number },
    writingResponse: { type: String },
    writingFeedback: {
      bandScore: { type: Number },
      taskAchievement: FeedbackScoreSchema,
      coherenceCohesion: FeedbackScoreSchema,
      lexicalResource: FeedbackScoreSchema,
      grammaticalRange: FeedbackScoreSchema,
      overallFeedback: { type: String },
    },
    speakingResponses: [
      {
        partNumber: { type: Number },
        questionNumber: { type: Number },
        audioUrl: { type: String },
        transcript: { type: String },
      },
    ],
    speakingFeedback: {
      bandScore: { type: Number },
      fluencyCoherence: FeedbackScoreSchema,
      lexicalResource: FeedbackScoreSchema,
      grammaticalRange: FeedbackScoreSchema,
      pronunciation: FeedbackScoreSchema,
      overallFeedback: { type: String },
    },
    timeSpent: { type: Number },
    completedAt: { type: Date },
    mode: {
      type: String,
      enum: ["practice", "timed", "review"],
      default: "practice",
    },
    status: {
      type: String,
      enum: ["pending", "evaluating", "completed", "failed"],
      default: "completed",
    },
  },
  { timestamps: true }
);

UserAttemptSchema.index({ userId: 1, sectionId: 1, createdAt: -1 });
UserAttemptSchema.index({ userId: 1, sectionType: 1, createdAt: -1 });

export default mongoose.models.UserAttempt ||
  mongoose.model<IUserAttemptDoc>("UserAttempt", UserAttemptSchema);

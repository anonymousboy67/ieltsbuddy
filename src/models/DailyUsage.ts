import mongoose, { Schema, type Document } from "mongoose";

export interface IDailyUsage extends Document {
  userId: mongoose.Types.ObjectId;
  date: string; // "YYYY-MM-DD" format for easy querying
  geminiSessionUsed: boolean;
  mockTestsToday: number;
  writingEvalsToday: number;
  speakingEvalsToday: number;
  createdAt: Date;
  updatedAt: Date;
}

const DailyUsageSchema = new Schema<IDailyUsage>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    date: { type: String, required: true },
    geminiSessionUsed: { type: Boolean, default: false },
    mockTestsToday: { type: Number, default: 0 },
    writingEvalsToday: { type: Number, default: 0 },
    speakingEvalsToday: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// One record per user per day
DailyUsageSchema.index({ userId: 1, date: 1 }, { unique: true });

export default mongoose.models.DailyUsage ||
  mongoose.model<IDailyUsage>("DailyUsage", DailyUsageSchema);

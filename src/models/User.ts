import mongoose, { Schema, type Document } from "mongoose";

export interface IStudyPlanTask {
  skill: "speaking" | "writing" | "reading" | "listening";
  taskTitle: string;
  duration: string;
  description: string;
  priority: "high" | "medium" | "low";
}

export interface IDayPlan {
  day: string;
  tasks: IStudyPlanTask[];
}

export interface IStudyPlan {
  weeklyPlan: IDayPlan[];
  focusAreas: string[];
  estimatedBandImprovement: number;
  tips: string[];
}

export interface IUser extends Document {
  name?: string;
  targetBand: number;
  testType: "academic" | "general";
  testDate?: Date;
  currentLevel: "beginner" | "intermediate" | "advanced";
  weaknesses: string[];
  dailyStudyTime: "15min" | "30min" | "1hour" | "2hours";
  studyPlan?: IStudyPlan;
  createdAt: Date;
}

const StudyPlanTaskSchema = new Schema(
  {
    skill: { type: String, enum: ["speaking", "writing", "reading", "listening"], required: true },
    taskTitle: { type: String, required: true },
    duration: { type: String, required: true },
    description: { type: String, required: true },
    priority: { type: String, enum: ["high", "medium", "low"], required: true },
  },
  { _id: false }
);

const DayPlanSchema = new Schema(
  {
    day: { type: String, required: true },
    tasks: [StudyPlanTaskSchema],
  },
  { _id: false }
);

const StudyPlanSchema = new Schema(
  {
    weeklyPlan: [DayPlanSchema],
    focusAreas: [String],
    estimatedBandImprovement: Number,
    tips: [String],
  },
  { _id: false }
);

const UserSchema = new Schema<IUser>({
  name: { type: String },
  targetBand: { type: Number, required: true },
  testType: { type: String, enum: ["academic", "general"], required: true },
  testDate: { type: Date },
  currentLevel: { type: String, enum: ["beginner", "intermediate", "advanced"], required: true },
  weaknesses: [{ type: String }],
  dailyStudyTime: { type: String, enum: ["15min", "30min", "1hour", "2hours"], required: true },
  studyPlan: StudyPlanSchema,
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.models.User ||
  mongoose.model<IUser>("User", UserSchema);

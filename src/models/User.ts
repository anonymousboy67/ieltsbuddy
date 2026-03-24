import mongoose, { Schema, type Document } from "mongoose";
import { getUsersConnection } from "@/lib/mongodb-connections";

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
  firebaseUid?: string;
  email?: string;
  username?: string;
  fullName?: string;
  image?: string;
  password?: string;
  authProvider?: "google" | "credentials";
  isDisabled: boolean;
  role: "student" | "admin";
  name?: string;
  targetBand?: number;
  testType?: "academic" | "general";
  testDate?: Date;
  currentLevel?: "beginner" | "intermediate" | "advanced";
  weaknesses: string[];
  dailyStudyTime?: "15min" | "30min" | "1hour" | "2hours";
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
  firebaseUid: { type: String, unique: true, sparse: true },
  email: { type: String, unique: true, sparse: true, lowercase: true, trim: true },
  username: { type: String, unique: true, sparse: true, lowercase: true, trim: true },
  fullName: { type: String, default: "" },
  image: { type: String },
  password: { type: String },
  authProvider: { type: String, enum: ["google", "credentials"] },
  isDisabled: { type: Boolean, default: false },
  role: { type: String, enum: ["student", "admin"], default: "student" },
  name: { type: String },
  targetBand: { type: Number },
  testType: { type: String, enum: ["academic", "general"] },
  testDate: { type: Date },
  currentLevel: { type: String, enum: ["beginner", "intermediate", "advanced"] },
  weaknesses: { type: [String], default: [] },
  dailyStudyTime: { type: String, enum: ["15min", "30min", "1hour", "2hours"] },
  studyPlan: StudyPlanSchema,
  createdAt: { type: Date, default: Date.now },
});

const usersConnection = getUsersConnection();

export default (usersConnection.models.User as mongoose.Model<IUser>) ||
  usersConnection.model<IUser>("User", UserSchema);

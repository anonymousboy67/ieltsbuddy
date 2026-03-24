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
  // Auth fields
  email: string;
  name?: string;
  image?: string;
  googleId?: string;
  emailVerified?: Date | null;

  // Onboarding fields
  targetBand: number;
  testType: "academic" | "general";
  testDate?: Date;
  currentLevel: "beginner" | "intermediate" | "advanced";
  weaknesses: string[];
  dailyStudyTime: "15min" | "30min" | "1hour" | "2hours";
  studyPlan?: IStudyPlan;

  // Settings fields
  examDate?: Date;
  weakSections: string[];
  dailyStudyHours: number;
  timerSounds: boolean;
  autoSubmit: boolean;
  fontSize: "small" | "medium" | "large";
  theme: "dark" | "light";
  dailyReminder: boolean;
  weeklyEmail: boolean;
  practiceAlerts: boolean;

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

const UserSchema = new Schema<IUser>(
  {
    // Auth
    email: { type: String, required: true, unique: true },
    name: { type: String },
    image: { type: String },
    googleId: { type: String },
    emailVerified: { type: Date, default: null },

    // Onboarding
    targetBand: { type: Number, default: 6.5 },
    testType: { type: String, enum: ["academic", "general"], default: "academic" },
    testDate: { type: Date },
    currentLevel: { type: String, enum: ["beginner", "intermediate", "advanced"], default: "intermediate" },
    weaknesses: [{ type: String }],
    dailyStudyTime: { type: String, enum: ["15min", "30min", "1hour", "2hours"], default: "1hour" },
    studyPlan: StudyPlanSchema,

    // Settings
    examDate: { type: Date },
    weakSections: { type: [String], default: [] },
    dailyStudyHours: { type: Number, default: 2 },
    timerSounds: { type: Boolean, default: true },
    autoSubmit: { type: Boolean, default: false },
    fontSize: { type: String, enum: ["small", "medium", "large"], default: "medium" },
    theme: { type: String, enum: ["dark", "light"], default: "dark" },
    dailyReminder: { type: Boolean, default: true },
    weeklyEmail: { type: Boolean, default: false },
    practiceAlerts: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.models.User ||
  mongoose.model<IUser>("User", UserSchema);

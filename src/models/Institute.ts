import mongoose, { Schema, type Document } from "mongoose";

export type InstitutePlan = "basic" | "silver" | "platinum";

export const PLAN_LIMITS: Record<InstitutePlan, { maxStudents: number }> = {
  basic: { maxStudents: 50 },
  silver: { maxStudents: 150 },
  platinum: { maxStudents: 400 },
};

export interface IInstitute extends Document {
  name: string;
  contactEmail: string;
  plan: InstitutePlan;
  maxStudents: number;
  totalQuota: number;
  status: "active" | "suspended";
  domain?: string;
  validUntil: Date;
  createdAt: Date;
  updatedAt: Date;
}

const InstituteSchema = new Schema<IInstitute>(
  {
    name: { type: String, required: true },
    contactEmail: { type: String, required: true, unique: true },
    plan: { type: String, enum: ["basic", "silver", "platinum"], default: "basic" },
    maxStudents: { type: Number, default: 50 },
    totalQuota: { type: Number, default: 0 },
    status: { type: String, enum: ["active", "suspended"], default: "active" },
    domain: { type: String },
    validUntil: { type: Date, required: true },
  },
  { timestamps: true }
);

export default mongoose.models.Institute ||
  mongoose.model<IInstitute>("Institute", InstituteSchema);

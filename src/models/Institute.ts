import mongoose, { Schema, type Document } from "mongoose";

export interface IInstitute extends Document {
  name: string;
  contactEmail: string;
  totalQuota: number;
  status: "active" | "suspended";
  domain?: string;
  createdAt: Date;
  updatedAt: Date;
}

const InstituteSchema = new Schema<IInstitute>(
  {
    name: { type: String, required: true },
    contactEmail: { type: String, required: true, unique: true },
    totalQuota: { type: Number, default: 0 },
    status: { type: String, enum: ["active", "suspended"], default: "active" },
    domain: { type: String },
  },
  { timestamps: true }
);

export default mongoose.models.Institute ||
  mongoose.model<IInstitute>("Institute", InstituteSchema);

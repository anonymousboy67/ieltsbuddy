import mongoose, { Schema, type Document } from "mongoose";

export interface IResource extends Document {
  title: string;
  description?: string;
  fileUrl: string;
  fileType: string;
  uploadedBy: mongoose.Types.ObjectId;
  instituteId?: mongoose.Types.ObjectId;
  targetStudents?: mongoose.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const ResourceSchema = new Schema<IResource>(
  {
    title: { type: String, required: true },
    description: { type: String },
    fileUrl: { type: String, required: true },
    fileType: { type: String, required: true },
    uploadedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    instituteId: { type: Schema.Types.ObjectId, ref: "Institute" },
    targetStudents: [{ type: Schema.Types.ObjectId, ref: "User" }],
  },
  { timestamps: true }
);

// Index for efficiently querying resources for a specific institute or teacher
ResourceSchema.index({ instituteId: 1, uploadedBy: 1 });

export default mongoose.models.Resource ||
  mongoose.model<IResource>("Resource", ResourceSchema);

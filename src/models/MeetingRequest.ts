import mongoose, { Schema, type Document } from "mongoose";

export interface IMeetingRequest extends Document {
  studentId: mongoose.Types.ObjectId;
  teacherId: mongoose.Types.ObjectId;
  topic?: string;
  requestedTime?: Date;
  teacherMessage?: string;
  status: "pending" | "accepted" | "declined" | "completed";
  createdAt: Date;
  updatedAt: Date;
}

const MeetingRequestSchema = new Schema<IMeetingRequest>(
  {
    studentId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    teacherId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    topic: { type: String },
    requestedTime: { type: Date },
    teacherMessage: { type: String }, // Used for joining instructions or Zoom links
    status: { 
      type: String, 
      enum: ["pending", "accepted", "declined", "completed"], 
      default: "pending" 
    },
  },
  { timestamps: true }
);

MeetingRequestSchema.index({ teacherId: 1, status: 1 });
MeetingRequestSchema.index({ studentId: 1, createdAt: -1 });

export default mongoose.models.MeetingRequest ||
  mongoose.model<IMeetingRequest>("MeetingRequest", MeetingRequestSchema);

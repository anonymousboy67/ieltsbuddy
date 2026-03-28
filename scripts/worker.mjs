import { Worker } from "bullmq";
import IORedis from "ioredis";
import mongoose from "mongoose";
import Anthropic from "@anthropic-ai/sdk";
import dotenv from "dotenv";
import { io } from "socket.io-client";

dotenv.config();

// --- CONFIGURATION ---
const REDIS_URL = process.env.REDIS_URL || "redis://127.0.0.1:6379";
const MONGODB_URI = process.env.MONGODB_URI;
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const SOCKET_SERVER_URL = process.env.SOCKET_SERVER_URL || "http://localhost:3001";

if (!MONGODB_URI || !ANTHROPIC_API_KEY) {
  console.error("CRITICAL ERROR: Missing MONGODB_URI or ANTHROPIC_API_KEY in environment.");
  process.exit(1);
}

// --- SOCKET CONNECTION (Internal) ---
const socket = io(SOCKET_SERVER_URL);
socket.on("connect", () => console.log("Worker connected to Socket server 🌐"));

// --- DB CONNECTION ---
const UserAttemptSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  sectionType: String,
  sectionId: mongoose.Schema.Types.ObjectId,
  sectionModel: String,
  writingResponse: String,
  writingFeedback: mongoose.Schema.Types.Mixed,
  bandScore: Number,
  status: { type: String, enum: ["pending", "evaluating", "completed", "failed"] },
  completedAt: Date,
}, { timestamps: true });

const UserAttempt = mongoose.models.UserAttempt || mongoose.model("UserAttempt", UserAttemptSchema);

async function connectDB() {
  await mongoose.connect(MONGODB_URI);
  console.log("Connected to MongoDB Atlas ✅");
}

// --- AI LOGIC ---
const anthropic = new Anthropic({ apiKey: ANTHROPIC_API_KEY });

async function evaluateWriting(taskInstructions, studentResponse, taskType) {
  const message = await anthropic.messages.create({
    model: "claude-3-haiku-20240307",
    max_tokens: 2048,
    system: "You are an expert IELTS examiner. Respond with ONLY valid JSON.",
    messages: [
      {
        role: "user",
        content: `Evaluate the following IELTS Writing ${taskType} response.\n\nInstructions:\n${taskInstructions}\n\nResponse:\n${studentResponse}\n\nReturn ONLY JSON: {"overallBand": <number>, "taskAchievement": {"band": <number>, "feedback": "<string>"}, "coherenceCohesion": {"band": <number>, "feedback": "<string>"}, "lexicalResource": {"band": <number>, "feedback": "<string>"}, "grammaticalRange": {"band": <number>, "feedback": "<string>"}, "strengths": ["string"], "improvements": ["string"], "correctedVersion": "string"}`
      }
    ]
  });

  return JSON.parse(message.content[0].text);
}

// --- WORKER SETUP ---
const connection = new IORedis(REDIS_URL, { maxRetriesPerRequest: null });

const worker = new Worker("evaluation-queue", async (job) => {
  const { attemptId, taskInstructions, studentResponse, taskType, userId } = job.data;
  console.log(`[WORKER] Processing attempt: ${attemptId} for user: ${userId}`);

  try {
    // 1. Call AI
    const evaluation = await evaluateWriting(taskInstructions, studentResponse, taskType);
    console.log(`[WORKER] AI Success for ${attemptId}, Band: ${evaluation.overallBand}`);

    // 2. Update DB
    await UserAttempt.findByIdAndUpdate(attemptId, {
      bandScore: evaluation.overallBand,
      writingFeedback: {
        bandScore: evaluation.overallBand,
        taskAchievement: evaluation.taskAchievement,
        coherenceCohesion: evaluation.coherenceCohesion,
        lexicalResource: evaluation.lexicalResource,
        grammaticalRange: evaluation.grammaticalRange,
        overallFeedback: evaluation.improvements?.join(" ") ?? "",
      },
      status: "completed",
      completedAt: new Date(),
    });

    // 3. Notify via Socket
    socket.emit("evaluation-finished", { userId, attemptId, sectionType: "writing" });
    console.log(`[WORKER] DB Updated & Notify sent for ${attemptId} ✅`);

  } catch (err) {
    console.error(`[WORKER] Failed to process ${attemptId}:`, err.message);
    await UserAttempt.findByIdAndUpdate(attemptId, { status: "failed" });
    socket.emit("evaluation-failed", { userId, attemptId });
    throw err;
  }
}, { connection });

worker.on("completed", (job) => console.log(`Job ${job.id} completed!`));
worker.on("failed", (job, err) => console.error(`Job ${job.id} failed: ${err.message}`));

connectDB().then(() => {
  console.log("IELTSBuddy Background Worker Started 🚀");
});

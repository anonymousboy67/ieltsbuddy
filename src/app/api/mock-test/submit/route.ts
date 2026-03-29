import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import UserAttempt from "@/models/UserAttempt";
import ReadingSection from "@/models/ReadingSection";
import ListeningSection from "@/models/ListeningSection";
import WritingTask from "@/models/WritingTask";
import mongoose from "mongoose";
import { Queue } from "bullmq";
import { checkDailyLimit, recordUsage } from "@/lib/dailyLimit";

/* ── Grading Helpers ────────────────────────────────────────── */
const READING_BAND_MAP: Record<number, number> = {
  40: 9, 39: 9, 38: 8.5, 37: 8.5, 36: 8, 35: 8, 34: 7.5, 33: 7.5, 32: 7, 31: 7, 30: 7,
  29: 6.5, 28: 6.5, 27: 6.5, 26: 6, 25: 6, 24: 6, 23: 6, 22: 5.5, 21: 5.5, 20: 5.5, 19: 5.5,
  18: 5, 17: 5, 16: 5, 15: 5, 14: 4.5, 13: 4.5, 12: 4, 11: 4, 10: 4, 9: 3.5, 8: 3.5, 7: 3, 6: 3,
  5: 2.5, 4: 2.5, 3: 2, 2: 2, 1: 1, 0: 0,
};

const LISTENING_BAND_MAP: Record<number, number> = {
  40: 9, 39: 9, 38: 8.5, 37: 8.5, 36: 8, 35: 8, 34: 7.5, 33: 7.5, 32: 7, 31: 7, 30: 7,
  29: 6.5, 28: 6.5, 27: 6.5, 26: 6, 25: 6, 24: 6, 23: 6, 22: 5.5, 21: 5.5, 20: 5.5, 19: 5.5,
  18: 5, 17: 5, 16: 5, 15: 5, 14: 4.5, 13: 4.5, 12: 4, 11: 4, 10: 4, 9: 3.5, 8: 3.5, 7: 3, 6: 3,
  5: 2.5, 4: 2.5, 3: 2, 2: 2, 1: 1, 0: 0,
};

function normalizeAnswer(ans: string | string[]): string {
  if (Array.isArray(ans)) return ans.map((a) => String(a).trim().toLowerCase()).sort().join(",");
  return String(ans).trim().toLowerCase();
}

function getBand(correct: number, type: "reading" | "listening"): number {
  const map = type === "reading" ? READING_BAND_MAP : LISTENING_BAND_MAP;
  return map[correct] ?? 0;
}

// Ensure the evaluation queue is instantiated to send Writing tasks to the worker
const redisUrl = process.env.REDIS_URL || "redis://127.0.0.1:6379";
const evaluationQueue = new Queue("evaluation-queue", {
  connection: { url: redisUrl }
});

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { bookNumber, testNumber, answers, writingText } = body;

    if (!bookNumber || !testNumber) {
      return NextResponse.json({ error: "Missing bookNumber or testNumber" }, { status: 400 });
    }

    // Check daily mock test limit
    const limit = await checkDailyLimit(session.user.id, "mockTest");
    if (!limit.allowed) {
      return NextResponse.json({ error: limit.message }, { status: 429 });
    }

    await dbConnect();
    const userId = session.user.id;
    const dummyId = new mongoose.Types.ObjectId(); // Fallback if section is empty

    const attemptsCreated = [];

    // 1. Grade Listening
    if (answers?.listening && Object.keys(answers.listening).length > 0) {
      const parts = await ListeningSection.find({ bookNumber, testNumber }).lean();
      let correctCount = 0;
      let totalQuestions = 0;
      const gradedAnswers: any[] = [];
      let firstId = parts.length > 0 ? parts[0]._id : dummyId;

      parts.forEach((p) => {
        p.questionGroups.forEach((g: any) => {
          g.questions.forEach((q: any) => {
            totalQuestions++;
            const studentAns = normalizeAnswer(answers.listening[q.questionNumber] || "");
            const correctAns = normalizeAnswer(q.correctAnswer || "");
            const isCorrect = correctAns !== "" && studentAns === correctAns;
            if (isCorrect) correctCount++;
            
            gradedAnswers.push({
              questionNumber: q.questionNumber,
              userAnswer: answers.listening[q.questionNumber] || "",
              correctAnswer: q.correctAnswer,
              isCorrect,
            });
          });
        });
      });

      if (totalQuestions > 0) {
        const attempt = await UserAttempt.create({
          userId,
          sectionType: "listening",
          sectionId: firstId,
          sectionModel: "ListeningSection",
          bookNumber,
          testNumber,
          answers: gradedAnswers,
          correctCount,
          totalQuestions,
          bandScore: getBand(correctCount, "listening"),
          mode: "timed",
          status: "completed",
        });
        attemptsCreated.push(attempt._id);
      }
    }

    // 2. Grade Reading
    if (answers?.reading && Object.keys(answers.reading).length > 0) {
      const passages = await ReadingSection.find({ bookNumber, testNumber }).lean();
      let correctCount = 0;
      let totalQuestions = 0;
      const gradedAnswers: any[] = [];
      let firstId = passages.length > 0 ? passages[0]._id : dummyId;

      passages.forEach((p) => {
        p.questionGroups.forEach((g: any) => {
          g.questions.forEach((q: any) => {
            totalQuestions++;
            const studentAns = normalizeAnswer(answers.reading[q.questionNumber] || "");
            const correctAns = normalizeAnswer(q.correctAnswer || "");
            const isCorrect = correctAns !== "" && studentAns === correctAns;
            if (isCorrect) correctCount++;
            
            gradedAnswers.push({
              questionNumber: q.questionNumber,
              userAnswer: answers.reading[q.questionNumber] || "",
              correctAnswer: q.correctAnswer,
              isCorrect,
            });
          });
        });
      });

      if (totalQuestions > 0) {
        const attempt = await UserAttempt.create({
          userId,
          sectionType: "reading",
          sectionId: firstId,
          sectionModel: "ReadingSection",
          bookNumber,
          testNumber,
          answers: gradedAnswers,
          correctCount,
          totalQuestions,
          bandScore: getBand(correctCount, "reading"),
          mode: "timed",
          status: "completed",
        });
        attemptsCreated.push(attempt._id);
      }
    }

    // 3. Save Writing via BullMQ
    if (writingText && writingText.trim().length > 0) {
      const task = await WritingTask.findOne({ bookNumber, testNumber }).lean();
      const taskId = task ? task._id : dummyId;

      const attempt = await UserAttempt.create({
        userId,
        sectionType: "writing",
        sectionId: taskId,
        sectionModel: "WritingTask",
        bookNumber,
        testNumber,
        writingResponse: writingText,
        mode: "timed",
        status: "evaluating",
      });

      attemptsCreated.push(attempt._id);

      // Add to BullMQ for the worker to process using Anthropic/Claude
      await evaluationQueue.add(
        "evaluate-writing",
        {
          attemptId: attempt._id,
          writingText,
          taskPrompt: task ? task.task1Prompt + "\\n" + task.task2Prompt : "Mock Test Writing Output",
        },
        { attempts: 3, backoff: 5000 }
      );
    }

    // Record mock test usage
    await recordUsage(session.user.id, "mockTest");

    return NextResponse.json({ success: true, attemptsCreated });
  } catch (error) {
    console.error("Mock test submit err:", error);
    return NextResponse.json({ error: "Failed to submit test" }, { status: 500 });
  }
}

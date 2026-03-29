import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import UserAttempt from "@/models/UserAttempt";
import { evaluationQueue } from "@/lib/queue";
import mongoose from "mongoose";
import { checkDailyLimit, recordUsage } from "@/lib/dailyLimit";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
       return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { taskInstructions, studentResponse, taskType } = await request.json();

    if (!taskInstructions || !studentResponse || !taskType) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Check daily writing evaluation limit
    const limit = await checkDailyLimit(session.user.id, "writingEval");
    if (!limit.allowed) {
      return NextResponse.json({ error: limit.message }, { status: 429 });
    }

    await dbConnect();

    // 1. Create the Attempt in "evaluating" state
    const attempt = await UserAttempt.create({
      userId: new mongoose.Types.ObjectId(session.user.id),
      sectionType: "writing",
      sectionId: new mongoose.Types.ObjectId(), // Placeholder for now
      sectionModel: "WritingTask",
      writingResponse: studentResponse,
      status: "evaluating",
      mode: "practice",
    });

    // 2. Add to the BullMQ Job Queue
    const job = await evaluationQueue.add(`writing-${attempt._id}`, {
      attemptId: attempt._id.toString(),
      taskInstructions,
      studentResponse,
      taskType,
      userId: session.user.id,
    });

    // Record usage
    await recordUsage(session.user.id, "writingEval");

    console.log(`[evaluate/writing] Queued job: ${job.id} for attempt: ${attempt._id}`);

    return NextResponse.json({ 
      success: true, 
      status: "evaluating", 
      attemptId: attempt._id,
      jobId: job.id
    }, { status: 202 });

  } catch (error: any) {
    console.error("[evaluate/writing] Error:", error.message);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

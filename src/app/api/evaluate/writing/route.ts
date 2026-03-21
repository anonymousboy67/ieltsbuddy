import { NextRequest, NextResponse } from "next/server";
import { evaluateWriting } from "@/lib/claude";

export async function POST(request: NextRequest) {
  console.log("[evaluate/writing] ANTHROPIC_API_KEY defined:", !!process.env.ANTHROPIC_API_KEY);
  console.log("[evaluate/writing] Key prefix:", process.env.ANTHROPIC_API_KEY?.slice(0, 10) + "...");

  try {
    const body = await request.json();
    const { taskInstructions, studentResponse, taskType } = body;

    console.log("[evaluate/writing] Received:", { taskType, instructionsLen: taskInstructions?.length, responseLen: studentResponse?.length });

    if (!taskInstructions || !studentResponse || !taskType) {
      return NextResponse.json(
        { error: "Missing required fields: taskInstructions, studentResponse, taskType" },
        { status: 400 }
      );
    }

    if (taskType !== "task1" && taskType !== "task2") {
      return NextResponse.json(
        { error: "taskType must be 'task1' or 'task2'" },
        { status: 400 }
      );
    }

    const evaluation = await evaluateWriting(taskInstructions, studentResponse, taskType);
    console.log("[evaluate/writing] Success, band:", evaluation.overallBand);
    return NextResponse.json(evaluation);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    const errorDetails = error instanceof Error ? { name: error.name, message: error.message, stack: error.stack } : error;
    console.error("[evaluate/writing] Error:", errorMessage);
    console.error("[evaluate/writing] Full error:", errorDetails);
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import WritingTask from "@/models/WritingTask";

export async function GET() {
  try {
    await dbConnect();
    const tasks = await WritingTask.find()
      .sort({ bookNumber: 1, testNumber: 1, taskType: 1 })
      .lean();
    return NextResponse.json(tasks);
  } catch (error) {
    console.error("Fetch writing tasks error:", error);
    return NextResponse.json({ error: "Failed to fetch writing tasks" }, { status: 500 });
  }
}

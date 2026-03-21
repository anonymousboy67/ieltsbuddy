import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import WritingTask from "@/models/WritingTask";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    const { id } = await params;
    const task = await WritingTask.findById(id).lean();
    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }
    return NextResponse.json(task);
  } catch (error) {
    console.error("Fetch writing task error:", error);
    return NextResponse.json({ error: "Failed to fetch task" }, { status: 500 });
  }
}

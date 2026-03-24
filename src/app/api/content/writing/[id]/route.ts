import { NextRequest, NextResponse } from "next/server";
import { connectContentDb } from "@/lib/mongodb-connections";
import WritingTask from "@/models/WritingTask";

function normalizeTask(doc: Record<string, unknown>): Record<string, unknown> {
  const taskType = doc.taskType as string;
  const isTask1 = taskType === "task1" || taskType === "DESCRIBE_VISUAL";

  return {
    ...doc,
    taskType: isTask1 ? "task1" : "task2",
    title: doc.title || doc.prompt || "",
    instructions: doc.instructions || doc.prompt || "",
    wordRequirement: doc.wordRequirement ?? doc.minWords ?? (isTask1 ? 150 : 250),
    timeMinutes: doc.timeMinutes ?? doc.timeRecommended ?? (isTask1 ? 20 : 40),
  };
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectContentDb();
    const { id } = await params;
    const task = await WritingTask.findById(id).lean();
    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }
    return NextResponse.json(normalizeTask(task as unknown as Record<string, unknown>));
  } catch (error) {
    console.error("Fetch writing task error:", error);
    return NextResponse.json({ error: "Failed to fetch task" }, { status: 500 });
  }
}

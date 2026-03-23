import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import WritingTask from "@/models/WritingTask";

// Normalize old docs (taskType "task1"/"task2") to new format,
// and map old field names to new ones for frontend compatibility.
function normalizeTask(doc: Record<string, unknown>): Record<string, unknown> {
  const taskType = doc.taskType as string;
  const isTask1 = taskType === "task1" || taskType === "DESCRIBE_VISUAL";

  return {
    ...doc,
    // Frontend expects "task1"/"task2" for filtering
    taskType: isTask1 ? "task1" : "task2",
    // Map new field names to old ones the frontend uses
    title: doc.title || doc.prompt || "",
    instructions: doc.instructions || doc.prompt || "",
    wordRequirement: doc.wordRequirement ?? doc.minWords ?? (isTask1 ? 150 : 250),
    timeMinutes: doc.timeMinutes ?? doc.timeRecommended ?? (isTask1 ? 20 : 40),
  };
}

export async function GET() {
  try {
    await dbConnect();
    const tasks = await WritingTask.collection
      .find({})
      .sort({ bookNumber: 1, testNumber: 1, taskNumber: 1 })
      .toArray();
    const normalized = tasks.map((t) => normalizeTask(t as Record<string, unknown>));
    return NextResponse.json(normalized);
  } catch (error) {
    console.error("Fetch writing tasks error:", error);
    return NextResponse.json({ error: "Failed to fetch writing tasks" }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import WritingTask from "@/models/WritingTask";

export async function GET() {
  try {
    await dbConnect();
    const tasks = await WritingTask.find().sort({ createdAt: -1 });
    return NextResponse.json(tasks);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await dbConnect();
    const body = await request.json();
    const task = await WritingTask.create(body);
    return NextResponse.json(task, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import SpeakingQuestion from "@/models/SpeakingQuestion";

export async function GET() {
  try {
    await dbConnect();
    const questions = await SpeakingQuestion.find().sort({ createdAt: -1 });
    return NextResponse.json(questions);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await dbConnect();
    const body = await request.json();
    const question = await SpeakingQuestion.create(body);
    return NextResponse.json(question, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import ReadingSection from "@/models/ReadingSection";

export async function GET() {
  try {
    await dbConnect();
    const passages = await ReadingSection.find().sort({ createdAt: -1 });
    return NextResponse.json(passages);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await dbConnect();
    const body = await request.json();
    const totalQuestions = (body.questionGroups || []).reduce(
      (sum: number, g: { questions: unknown[] }) => sum + g.questions.length,
      0
    );
    const passage = await ReadingSection.create({
      bookNumber: body.bookNumber,
      testNumber: body.testNumber,
      passageNumber: body.passageNumber ?? body.partNumber,
      title: body.title,
      subtitle: body.subtitle,
      topic: body.topic,
      difficulty: body.difficulty,
      passage: body.passage,
      passageSections: body.passageSections,
      totalQuestions,
      questionGroups: body.questionGroups,
      footnotes: body.footnotes,
    });
    return NextResponse.json(passage, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

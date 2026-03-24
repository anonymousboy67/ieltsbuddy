import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import ListeningSection from "@/models/ListeningSection";

export async function GET() {
  try {
    await dbConnect();
    const sections = await ListeningSection.find().sort({
      bookNumber: 1,
      testNumber: 1,
      partNumber: 1,
    });
    return NextResponse.json(sections);
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
    const section = await ListeningSection.create({
      ...body,
      totalQuestions,
    });
    return NextResponse.json(section, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

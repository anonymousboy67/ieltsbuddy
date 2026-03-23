import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import ReadingSection from "@/models/ReadingSection";

export async function GET() {
  try {
    await dbConnect();
    const passages = await ReadingSection.find()
      .sort({ bookNumber: 1, testNumber: 1, passageNumber: 1 })
      .lean();

    const grouped: Record<
      string,
      {
        bookNumber: number;
        testNumber: number;
        passages: {
          _id: string;
          passageNumber: number;
          title: string;
          topic: string;
          difficulty: string;
          questionGroups: { questions: { questionNumber: number }[] }[];
          totalQuestions: number;
          passagePreview: string;
        }[];
      }
    > = {};

    for (const p of passages) {
      const key = `${p.bookNumber}-${p.testNumber}`;
      if (!grouped[key]) {
        grouped[key] = {
          bookNumber: p.bookNumber,
          testNumber: p.testNumber,
          passages: [],
        };
      }
      const totalQuestions = (p.questionGroups || []).reduce(
        (sum: number, g: { questions: unknown[] }) => sum + g.questions.length,
        0
      );
      grouped[key].passages.push({
        _id: String(p._id),
        passageNumber: p.passageNumber,
        title: p.title,
        topic: p.topic,
        difficulty: p.difficulty,
        questionGroups: p.questionGroups,
        totalQuestions,
        passagePreview: p.passage.slice(0, 200),
      });
    }

    return NextResponse.json(Object.values(grouped));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import { connectContentDb } from "@/lib/mongodb-connections";
import ReadingSection from "@/models/ReadingSection";

export async function GET() {
  try {
    await connectContentDb();
    const passages = await ReadingSection.find()
      .sort({ bookNumber: 1, testNumber: 1, passageNumber: 1 })
      .lean();

    type LeanPassage = {
      _id: unknown;
      bookNumber: number;
      testNumber: number;
      passageNumber: number;
      title: string;
      topic: string;
      difficulty: string;
      passage: string;
      questionGroups?: Array<{ questions?: unknown[] }>;
    };

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

    for (const raw of passages) {
      const p = raw as unknown as LeanPassage;
      const key = `${p.bookNumber}-${p.testNumber}`;
      if (!grouped[key]) {
        grouped[key] = {
          bookNumber: p.bookNumber,
          testNumber: p.testNumber,
          passages: [],
        };
      }
      const totalQuestions = (p.questionGroups || []).reduce(
        (sum: number, g) => sum + (Array.isArray(g.questions) ? g.questions.length : 0),
        0
      );
      const normalizedQuestionGroups = (p.questionGroups || []).map((g) => ({
        questions: Array.isArray(g.questions)
          ? (g.questions as { questionNumber: number }[])
          : [],
      }));
      grouped[key].passages.push({
        _id: String(p._id),
        passageNumber: p.passageNumber,
        title: p.title,
        topic: p.topic,
        difficulty: p.difficulty,
        questionGroups: normalizedQuestionGroups,
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

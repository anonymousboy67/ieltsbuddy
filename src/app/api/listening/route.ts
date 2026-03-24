import { NextResponse } from "next/server";
import { connectContentDb } from "@/lib/mongodb-connections";
import ListeningSection from "@/models/ListeningSection";

export async function GET() {
  try {
    await connectContentDb();
    const sections = await ListeningSection.find()
      .sort({ bookNumber: 1, testNumber: 1, partNumber: 1 })
      .lean();

    const grouped: Record<
      string,
      {
        bookNumber: number;
        testNumber: number;
        parts: {
          partNumber: number;
          title?: string;
          totalQuestions: number;
          hasAudio: boolean;
        }[];
      }
    > = {};

    for (const s of sections) {
      const key = `${s.bookNumber}-${s.testNumber}`;
      if (!grouped[key]) {
        grouped[key] = {
          bookNumber: s.bookNumber,
          testNumber: s.testNumber,
          parts: [],
        };
      }
      grouped[key].parts.push({
        partNumber: s.partNumber,
        title: s.title,
        totalQuestions: s.totalQuestions,
        hasAudio: !!s.audioUrl,
      });
    }

    return NextResponse.json(Object.values(grouped));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

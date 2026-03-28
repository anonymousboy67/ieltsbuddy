import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import ReadingSection from "@/models/ReadingSection";
import ListeningSection from "@/models/ListeningSection";
import WritingTask from "@/models/WritingTask";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();

    const [readings, listenings, writings] = await Promise.all([
      ReadingSection.find({}, { bookNumber: 1, testNumber: 1, title: 1 }).lean(),
      ListeningSection.find({}, { bookNumber: 1, testNumber: 1 }).lean(),
      WritingTask.find({}, { bookNumber: 1, testNumber: 1, taskType: 1 }).lean(),
    ]);

    // Group all sections by book+test key
    const testMap: Record<
      string,
      {
        bookNumber: number;
        testNumber: number;
        hasReading: boolean;
        hasListening: boolean;
        hasWriting: boolean;
        readingIds: string[];
        listeningIds: string[];
        writingIds: string[];
      }
    > = {};

    for (const r of readings) {
      const key = `${r.bookNumber}-${r.testNumber}`;
      if (!testMap[key]) {
        testMap[key] = {
          bookNumber: r.bookNumber,
          testNumber: r.testNumber,
          hasReading: false,
          hasListening: false,
          hasWriting: false,
          readingIds: [],
          listeningIds: [],
          writingIds: [],
        };
      }
      testMap[key].hasReading = true;
      testMap[key].readingIds.push(String(r._id));
    }

    for (const l of listenings) {
      const key = `${l.bookNumber}-${l.testNumber}`;
      if (!testMap[key]) {
        testMap[key] = {
          bookNumber: l.bookNumber,
          testNumber: l.testNumber,
          hasReading: false,
          hasListening: false,
          hasWriting: false,
          readingIds: [],
          listeningIds: [],
          writingIds: [],
        };
      }
      testMap[key].hasListening = true;
      testMap[key].listeningIds.push(String(l._id));
    }

    for (const w of writings) {
      const key = `${w.bookNumber}-${w.testNumber}`;
      if (!testMap[key]) {
        testMap[key] = {
          bookNumber: w.bookNumber,
          testNumber: w.testNumber,
          hasReading: false,
          hasListening: false,
          hasWriting: false,
          readingIds: [],
          listeningIds: [],
          writingIds: [],
        };
      }
      testMap[key].hasWriting = true;
      testMap[key].writingIds.push(String(w._id));
    }

    const tests = Object.values(testMap).sort(
      (a, b) => a.bookNumber - b.bookNumber || a.testNumber - b.testNumber
    );

    return NextResponse.json(tests);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

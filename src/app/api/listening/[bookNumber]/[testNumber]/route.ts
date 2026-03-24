import { NextResponse } from "next/server";
import { connectContentDb } from "@/lib/mongodb-connections";
import ListeningSection from "@/models/ListeningSection";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ bookNumber: string; testNumber: string }> }
) {
  try {
    await connectContentDb();
    const { bookNumber, testNumber } = await params;
    const sections = await ListeningSection.find({
      bookNumber: Number(bookNumber),
      testNumber: Number(testNumber),
    })
      .sort({ partNumber: 1 })
      .lean();

    return NextResponse.json(sections);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

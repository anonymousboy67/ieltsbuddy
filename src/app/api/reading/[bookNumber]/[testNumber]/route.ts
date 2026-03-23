import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import ReadingSection from "@/models/ReadingSection";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ bookNumber: string; testNumber: string }> }
) {
  try {
    await dbConnect();
    const { bookNumber, testNumber } = await params;
    const passages = await ReadingSection.find({
      bookNumber: Number(bookNumber),
      testNumber: Number(testNumber),
    })
      .sort({ partNumber: 1 })
      .lean();

    return NextResponse.json(passages);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

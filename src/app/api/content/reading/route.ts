import { NextResponse } from "next/server";
import { connectContentDb } from "@/lib/mongodb-connections";
import ReadingSection from "@/models/ReadingSection";

export async function GET() {
  try {
    await connectContentDb();
    const passages = await ReadingSection.find()
      .sort({ bookNumber: 1, testNumber: 1, passageNumber: 1 })
      .lean();
    return NextResponse.json(passages);
  } catch (error) {
    console.error("Fetch reading passages error:", error);
    return NextResponse.json({ error: "Failed to fetch reading passages" }, { status: 500 });
  }
}

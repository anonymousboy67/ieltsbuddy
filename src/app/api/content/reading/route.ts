import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import ReadingPassage from "@/models/ReadingPassage";

export async function GET() {
  try {
    await dbConnect();
    const passages = await ReadingPassage.find()
      .sort({ bookNumber: 1, testNumber: 1, partNumber: 1 })
      .lean();
    return NextResponse.json(passages);
  } catch (error) {
    console.error("Fetch reading passages error:", error);
    return NextResponse.json({ error: "Failed to fetch reading passages" }, { status: 500 });
  }
}

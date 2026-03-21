import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import ReadingPassage from "@/models/ReadingPassage";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    const { id } = await params;
    const passage = await ReadingPassage.findById(id).lean();
    if (!passage) {
      return NextResponse.json({ error: "Passage not found" }, { status: 404 });
    }
    return NextResponse.json(passage);
  } catch (error) {
    console.error("Fetch reading passage error:", error);
    return NextResponse.json({ error: "Failed to fetch passage" }, { status: 500 });
  }
}

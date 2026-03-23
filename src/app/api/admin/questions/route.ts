import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import ReadingSection from "@/models/ReadingSection";

export async function POST(request: NextRequest) {
  try {
    await dbConnect();
    const body = await request.json();
    const { sectionId, questionGroups } = body;

    if (!sectionId || !questionGroups) {
      return NextResponse.json(
        { error: "sectionId and questionGroups are required" },
        { status: 400 }
      );
    }

    const section = await ReadingSection.findByIdAndUpdate(
      sectionId,
      { $set: { questionGroups } },
      { new: true }
    );

    if (!section) {
      return NextResponse.json({ error: "Section not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: section }, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

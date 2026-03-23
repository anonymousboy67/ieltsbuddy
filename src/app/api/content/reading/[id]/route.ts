import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import ReadingSection from "@/models/ReadingSection";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    const { id } = await params;
    const section = await ReadingSection.findById(id).lean();
    if (!section) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json(section);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

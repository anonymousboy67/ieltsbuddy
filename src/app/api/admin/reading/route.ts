import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import ReadingPassage from "@/models/ReadingPassage";

export async function GET() {
  try {
    await dbConnect();
    const passages = await ReadingPassage.find().sort({ createdAt: -1 });
    return NextResponse.json(passages);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await dbConnect();
    const body = await request.json();
    const passage = await ReadingPassage.create(body);
    return NextResponse.json(passage, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

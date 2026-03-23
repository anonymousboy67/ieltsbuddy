import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import SpeakingPart from "@/models/SpeakingPart";

export async function GET() {
  try {
    await dbConnect();
    const parts = await SpeakingPart.find().sort({ createdAt: -1 });
    return NextResponse.json(parts);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await dbConnect();
    const body = await request.json();
    const part = await SpeakingPart.create(body);
    return NextResponse.json(part, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

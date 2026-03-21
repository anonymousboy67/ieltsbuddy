import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import SpeakingQuestion from "@/models/SpeakingQuestion";

export async function GET() {
  try {
    await dbConnect();
    const questions = await SpeakingQuestion.find()
      .sort({ bookNumber: 1, testNumber: 1, partNumber: 1 })
      .lean();
    return NextResponse.json(questions);
  } catch (error) {
    console.error("Fetch speaking questions error:", error);
    return NextResponse.json({ error: "Failed to fetch speaking questions" }, { status: 500 });
  }
}

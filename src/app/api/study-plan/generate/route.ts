import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";
import { generateStudyPlan } from "@/lib/studyPlan";

export async function POST(request: NextRequest) {
  try {
    await dbConnect();

    const { userId } = await request.json();
    if (!userId) {
      return NextResponse.json({ error: "userId is required" }, { status: 400 });
    }

    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const plan = await generateStudyPlan({
      targetBand: user.targetBand,
      currentLevel: user.currentLevel,
      weaknesses: user.weaknesses,
      dailyStudyTime: user.dailyStudyTime,
      testDate: user.testDate,
    });

    user.studyPlan = plan;
    await user.save();

    return NextResponse.json({
      plan,
      targetBand: user.targetBand,
      testDate: user.testDate,
    });
  } catch (error) {
    console.error("Study plan generation error:", error);
    const msg = error instanceof Error ? error.message : "Failed to generate study plan";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

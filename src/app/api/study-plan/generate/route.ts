import { NextRequest, NextResponse } from "next/server";
import { connectUsersDb } from "@/lib/mongodb-connections";
import User from "@/models/User";
import { generateStudyPlan } from "@/lib/studyPlan";

export async function POST(request: NextRequest) {
  try {
    await connectUsersDb();

    const { userId } = await request.json();
    if (!userId) {
      return NextResponse.json({ error: "userId is required" }, { status: 400 });
    }

    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // New users can have partial onboarding data; guard and normalize for generator input.
    const targetBand =
      typeof user.targetBand === "number" && Number.isFinite(user.targetBand)
        ? user.targetBand
        : 6;
    const currentLevel = user.currentLevel || "intermediate";
    const weaknesses = Array.isArray(user.weaknesses) ? user.weaknesses : [];
    const dailyStudyTime = user.dailyStudyTime || "30min";

    const plan = await generateStudyPlan({
      targetBand,
      currentLevel,
      weaknesses,
      dailyStudyTime,
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

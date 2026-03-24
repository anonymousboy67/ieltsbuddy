import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();
    const body = await request.json();
    const {
      targetBand,
      testType,
      testDate,
      currentLevel,
      weaknesses,
      dailyStudyTime,
    } = body;

    const update: Record<string, unknown> = {
      onboardingComplete: true,
    };

    if (targetBand) update.targetBand = parseFloat(targetBand);
    if (testType) update.testType = testType;
    if (testDate) update.testDate = new Date(testDate);
    if (currentLevel) update.currentLevel = currentLevel;
    if (weaknesses) update.weaknesses = weaknesses;
    if (dailyStudyTime) update.dailyStudyTime = dailyStudyTime;

    const user = await User.findOneAndUpdate(
      { email: session.user.email },
      { $set: update },
      { new: true }
    );

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ userId: user._id });
  } catch (error) {
    console.error("Onboarding error:", error);
    return NextResponse.json(
      { error: "Failed to save onboarding data" },
      { status: 500 }
    );
  }
}

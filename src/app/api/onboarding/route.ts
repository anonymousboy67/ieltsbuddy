import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";

export async function POST(request: NextRequest) {
  try {
    await dbConnect();

    const body = await request.json();
    const { targetBand, testType, testDate, currentLevel, weaknesses, dailyStudyTime } = body;

    if (!targetBand || !testType || !currentLevel || !dailyStudyTime) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const user = await User.create({
      targetBand: parseFloat(targetBand),
      testType,
      testDate: testDate ? new Date(testDate) : undefined,
      currentLevel,
      weaknesses: weaknesses || [],
      dailyStudyTime,
    });

    return NextResponse.json({ userId: user._id });
  } catch (error) {
    console.error("Onboarding error:", error);
    return NextResponse.json(
      { error: "Failed to save onboarding data" },
      { status: 500 }
    );
  }
}

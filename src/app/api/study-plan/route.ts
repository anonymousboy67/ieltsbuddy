import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";

export async function GET(request: NextRequest) {
  try {
    await dbConnect();

    const userId = request.nextUrl.searchParams.get("userId");
    if (!userId) {
      return NextResponse.json({ error: "userId is required" }, { status: 400 });
    }

    const user = await User.findById(userId).lean();
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      plan: user.studyPlan || null,
      targetBand: user.targetBand,
      testDate: user.testDate || null,
    });
  } catch (error) {
    console.error("Fetch study plan error:", error);
    return NextResponse.json({ error: "Failed to fetch study plan" }, { status: 500 });
  }
}

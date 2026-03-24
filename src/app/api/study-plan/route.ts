import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();
    const user = await User.findOne({ email: session.user.email }).lean();
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

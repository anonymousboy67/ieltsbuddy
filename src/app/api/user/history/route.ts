import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import UserAttempt from "@/models/UserAttempt";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();

    const attempts = await UserAttempt.find(
      { userId: session.user.id },
      {
        sectionType: 1,
        bandScore: 1,
        bookNumber: 1,
        testNumber: 1,
        completedAt: 1,
        createdAt: 1,
        "speakingFeedback.fluencyCoherence": 1,
        "speakingFeedback.lexicalResource": 1,
        "speakingFeedback.grammaticalRange": 1,
        "speakingFeedback.pronunciation": 1,
        "speakingFeedback.overallFeedback": 1,
        "writingFeedback.taskAchievement": 1,
        "writingFeedback.coherenceCohesion": 1,
        "writingFeedback.lexicalResource": 1,
        "writingFeedback.grammaticalRange": 1,
        "writingFeedback.overallFeedback": 1,
        speakingResponses: 1,
      }
    )
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    return NextResponse.json(attempts);
  } catch (error) {
    console.error("[user/history] error:", error);
    return NextResponse.json({ error: "Failed to fetch history" }, { status: 500 });
  }
}

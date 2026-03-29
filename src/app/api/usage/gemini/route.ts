import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { checkDailyLimit, recordUsage } from "@/lib/dailyLimit";

// GET: Check if user can start a Gemini session
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const limit = await checkDailyLimit(session.user.id, "gemini");
    return NextResponse.json({ allowed: limit.allowed, message: limit.message });
  } catch (error) {
    console.error("[api/usage/gemini] GET error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// POST: Record that user started a Gemini session
export async function POST() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const limit = await checkDailyLimit(session.user.id, "gemini");
    if (!limit.allowed) {
      return NextResponse.json({ error: limit.message }, { status: 429 });
    }

    await recordUsage(session.user.id, "gemini");
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[api/usage/gemini] POST error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

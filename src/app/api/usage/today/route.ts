import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getTodayUsage } from "@/lib/dailyLimit";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const usage = await getTodayUsage(session.user.id);
    return NextResponse.json(usage);
  } catch (error) {
    console.error("[api/usage/today] Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

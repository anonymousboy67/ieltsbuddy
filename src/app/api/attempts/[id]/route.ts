import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import UserAttempt from "@/models/UserAttempt";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();
    const { id: attemptId } = await params;
    
    const attempt = await UserAttempt.findById(attemptId).lean();
    
    if (!attempt) {
      return NextResponse.json({ error: "Attempt not found" }, { status: 404 });
    }

    // Security: Only the owner or an admin/teacher can see the attempt
    if (attempt.userId.toString() !== session.user.id && session.user.role === "student") {
      return NextResponse.json({ error: "Access Denied" }, { status: 403 });
    }

    return NextResponse.json(attempt);
  } catch (error: any) {
    console.error("[api/attempts/[id]] Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

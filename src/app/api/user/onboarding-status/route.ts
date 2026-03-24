import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ onboardingComplete: false });
    }

    await dbConnect();
    const user = await User.findOne(
      { email: session.user.email },
      { onboardingComplete: 1 }
    ).lean();

    return NextResponse.json({
      onboardingComplete: user?.onboardingComplete ?? false,
    });
  } catch {
    return NextResponse.json({ onboardingComplete: false });
  }
}

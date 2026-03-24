import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";

const SETTINGS_FIELDS = [
  "targetBand",
  "examDate",
  "weakSections",
  "dailyStudyHours",
  "timerSounds",
  "autoSubmit",
  "fontSize",
  "theme",
  "dailyReminder",
  "weeklyEmail",
  "practiceAlerts",
] as const;

export async function GET() {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await dbConnect();
  const user = await User.findOne({ email: session.user.email }).lean();
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const settings: Record<string, unknown> = {};
  for (const field of SETTINGS_FIELDS) {
    if (field in user) {
      settings[field] = (user as Record<string, unknown>)[field];
    }
  }

  return NextResponse.json(settings);
}

export async function PUT(request: Request) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await dbConnect();
  const body = await request.json();

  // Only allow settings fields to be updated
  const update: Record<string, unknown> = {};
  for (const field of SETTINGS_FIELDS) {
    if (field in body) {
      update[field] = body[field];
    }
  }

  const user = await User.findOneAndUpdate(
    { email: session.user.email },
    { $set: update },
    { new: true, upsert: false }
  );

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}

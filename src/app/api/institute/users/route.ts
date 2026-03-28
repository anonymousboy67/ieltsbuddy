import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "institute") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { name, email, password, role, instituteId } = await req.json();

    if (!name || !email || !password || !role || !instituteId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Security check: Ensure the logged-in institute is only adding users to THEIR OWN institute
    if (session.user.instituteId !== instituteId) {
       return NextResponse.json({ error: "Access Denied" }, { status: 403 });
    }

    await dbConnect();

    // Check if user already exists
    const existing = await User.findOne({ email });
    if (existing) {
      return NextResponse.json({ error: "User already registered" }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const newUser = await User.create({
      name,
      email,
      password: hashedPassword,
      role,
      instituteId,
      onboardingComplete: true,
    });

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error: any) {
    console.error("[api/institute/users] Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

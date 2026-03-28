import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const callerRole = session.user.role;
    if (callerRole !== "admin" && callerRole !== "institute") {
      return NextResponse.json({ error: "Forbidden. Admins or Institutes only." }, { status: 403 });
    }

    const { email, password, name, role, targetInstituteId } = await req.json();

    if (!email || !password || !role) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Security: Only admins can create other admins/institutes.
    if (callerRole !== "admin" && (role === "admin" || role === "institute")) {
      return NextResponse.json({ error: "Forbidden role assignment" }, { status: 403 });
    }

    // Security: Institutes can only create users under their own umbrella.
    let finalInstituteId = targetInstituteId;
    if (callerRole === "institute") {
      finalInstituteId = session.user.instituteId;
      if (!finalInstituteId) {
        return NextResponse.json({ error: "Institute ID missing from caller session" }, { status: 400 });
      }
    }

    await dbConnect();
    
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return NextResponse.json({ error: "Email already exists" }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await User.create({
      email,
      name,
      password: hashedPassword,
      role,
      instituteId: finalInstituteId,
      // Auto-complete onboarding for Institute-generated accounts
      onboardingComplete: true, 
    });

    return NextResponse.json({ 
      success: true, 
      user: { id: newUser._id, email: newUser.email, role: newUser.role } 
    });

  } catch (error) {
    console.error("[api/admin/create-credential] error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";

export async function GET() {
  try {
    const adminToken = (await cookies()).get("admin_session");
    if (adminToken?.value !== "ieltsbuddy_admin_authenticated") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();
    // Default role for standard users is student, but older records might not have the field explicitly set.
    const students = await User.find({ 
      $or: [{ role: "student" }, { role: { $exists: false } }] 
    }).sort({ createdAt: -1 }).lean();

    return NextResponse.json(students);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch students" }, { status: 500 });
  }
}

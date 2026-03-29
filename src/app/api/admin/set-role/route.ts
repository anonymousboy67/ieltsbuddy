import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";

export async function POST(req: Request) {
  // Only allow if admin cookie is set (from /admin/login)
  const adminToken = (await cookies()).get("admin_session");
  if (adminToken?.value !== "ieltsbuddy_admin_authenticated") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { email, role } = await req.json();

  if (!email || !role) {
    return NextResponse.json({ error: "email and role are required" }, { status: 400 });
  }

  const validRoles = ["admin", "institute", "teacher", "student"];
  if (!validRoles.includes(role)) {
    return NextResponse.json({ error: `Invalid role. Must be one of: ${validRoles.join(", ")}` }, { status: 400 });
  }

  await dbConnect();

  const user = await User.findOneAndUpdate(
    { email },
    { $set: { role } },
    { new: true }
  );

  if (!user) {
    return NextResponse.json({ error: `No user found with email: ${email}` }, { status: 404 });
  }

  return NextResponse.json({
    success: true,
    user: { email: user.email, name: user.name, role: user.role },
  });
}

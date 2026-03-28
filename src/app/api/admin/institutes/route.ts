import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import Institute from "@/models/Institute";

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { name, contactEmail, totalQuota } = await req.json();

    if (!name || !contactEmail) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    await dbConnect();

    const newInstitute = await Institute.create({
      name,
      contactEmail,
      totalQuota: totalQuota || 100000,
      usedQuota: 0,
      status: "active",
    });

    return NextResponse.json(newInstitute, { status: 201 });
  } catch (error: any) {
    console.error("[api/admin/institutes] Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

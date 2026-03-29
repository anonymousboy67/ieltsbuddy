import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import Institute, { PLAN_LIMITS, type InstitutePlan } from "@/models/Institute";

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { name, contactEmail, plan, validityMonths } = await req.json();

    if (!name || !contactEmail) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const selectedPlan: InstitutePlan = plan || "basic";
    const planLimits = PLAN_LIMITS[selectedPlan];
    const months = validityMonths || 3;

    // Calculate validUntil date
    const validUntil = new Date();
    validUntil.setMonth(validUntil.getMonth() + months);

    await dbConnect();

    const newInstitute = await Institute.create({
      name,
      contactEmail,
      plan: selectedPlan,
      maxStudents: planLimits.maxStudents,
      totalQuota: 0,
      status: "active",
      validUntil,
    });

    return NextResponse.json(newInstitute, { status: 201 });
  } catch (error: any) {
    console.error("[api/admin/institutes] Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import ListeningSection from "@/models/ListeningSection";

type Ctx = { params: Promise<{ id: string }> };

export async function PUT(request: Request, { params }: Ctx) {
  try {
    await dbConnect();
    const { id } = await params;
    const body = await request.json();
    const totalQuestions = (body.questionGroups || []).reduce(
      (sum: number, g: { questions: unknown[] }) => sum + g.questions.length,
      0
    );
    const updated = await ListeningSection.findByIdAndUpdate(
      id,
      { ...body, totalQuestions },
      { new: true, runValidators: true }
    );
    if (!updated) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(updated);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function DELETE(_request: Request, { params }: Ctx) {
  try {
    await dbConnect();
    const { id } = await params;
    const deleted = await ListeningSection.findByIdAndDelete(id);
    if (!deleted) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

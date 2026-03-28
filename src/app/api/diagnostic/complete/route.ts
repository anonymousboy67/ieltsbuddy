import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { answers, targetBand, currentLevel, weaknesses } = await req.json();

    // Format the answers for Claude
    const formattedAnswers = Object.entries(answers as Record<string, string>)
      .map(([qId, answer]) => `Q${qId}: ${answer}`)
      .join("\n");

    const prompt = `You are an expert IELTS assessor. Evaluate the following student diagnostic quiz answers and generate a personalized study plan.

Student Profile:
- Target Band Score: ${targetBand}
- Self-reported Level: ${currentLevel}
- Self-reported Weaknesses: ${weaknesses.join(", ")}

Student's Diagnostic Answers:
${formattedAnswers}

Based on these answers, provide a JSON response (no markdown, pure JSON) with this exact structure:
{
  "estimatedBand": <number between 3.5 and 8.5, in 0.5 increments>,
  "focusAreas": [<2-4 strings like "Reading comprehension", "Writing coherence", "Vocabulary range">],
  "detectedWeaknesses": [<2-3 strings identifying specific weaknesses from the answers>],
  "studyPlan": {
    "weeklyPlan": [
      {
        "day": "Monday",
        "tasks": [
          {
            "skill": "reading",
            "taskTitle": "<specific task>",
            "duration": "30 mins",
            "description": "<what to do and why>",
            "priority": "high"
          }
        ]
      },
      { "day": "Tuesday", "tasks": [...] },
      { "day": "Wednesday", "tasks": [...] },
      { "day": "Thursday", "tasks": [...] },
      { "day": "Friday", "tasks": [...] },
      { "day": "Saturday", "tasks": [...] },
      { "day": "Sunday", "tasks": [...] }
    ],
    "focusAreas": [<same as top-level focusAreas>],
    "estimatedBandImprovement": <number like 0.5 or 1.0>,
    "tips": [<3 specific IELTS tips tailored to this student's weaknesses>]
  }
}`;

    const message = await anthropic.messages.create({
      model: "claude-3-5-haiku-20241022",
      max_tokens: 2000,
      messages: [{ role: "user", content: prompt }],
    });

    const content = message.content[0];
    if (content.type !== "text") {
      throw new Error("Unexpected Claude response type");
    }

    // Parse Claude's JSON response
    let result: {
      estimatedBand: number;
      focusAreas: string[];
      detectedWeaknesses: string[];
      studyPlan: Record<string, unknown>;
    };
    try {
      result = JSON.parse(content.text);
    } catch {
      // Try to extract JSON from response
      const jsonMatch = content.text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error("Claude did not return valid JSON");
      result = JSON.parse(jsonMatch[0]);
    }

    // Save to User document
    await dbConnect();
    await User.findByIdAndUpdate(session.user.id, {
      $set: {
        currentLevel:
          result.estimatedBand >= 7
            ? "advanced"
            : result.estimatedBand >= 5
              ? "intermediate"
              : "beginner",
        weaknesses: result.detectedWeaknesses ?? weaknesses,
        studyPlan: result.studyPlan,
      },
    });

    return NextResponse.json({
      estimatedBand: result.estimatedBand,
      focusAreas: result.focusAreas,
      detectedWeaknesses: result.detectedWeaknesses,
    });
  } catch (error) {
    console.error("[api/diagnostic/complete] Error:", error);
    return NextResponse.json({ error: "Failed to generate study plan" }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { checkDailyLimit, recordUsage } from "@/lib/dailyLimit";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM_PROMPT = `You are an IELTS Speaking examiner. Evaluate the candidate's spoken response against these 4 criteria, each scored 0-9:

1. Fluency & Coherence - How smoothly and logically the candidate speaks
2. Lexical Resource - Range and accuracy of vocabulary used
3. Grammatical Range & Accuracy - Variety and correctness of grammar
4. Pronunciation - Based on text complexity, word choice sophistication, and natural phrasing as a proxy

Consider the part type:
- INTERVIEW (Part 1): Expect shorter, direct answers on familiar topics
- CUE_CARD (Part 2): Expect extended speech (1-2 min) with some structure
- DISCUSSION (Part 3): Expect more complex ideas, opinions, and argumentation

Return ONLY valid JSON (no markdown, no code blocks):
{
  "overallBand": <number 0-9, half bands allowed>,
  "criteria": {
    "fluencyCoherence": { "score": <number>, "feedback": "<string>" },
    "lexicalResource": { "score": <number>, "feedback": "<string>" },
    "grammaticalRange": { "score": <number>, "feedback": "<string>" },
    "pronunciation": { "score": <number>, "feedback": "<string>" }
  },
  "overallFeedback": "<string>",
  "improvements": ["<string>", "<string>", "<string>"]
}`;

export async function POST(request: NextRequest) {
  try {
    const { transcript, question, partType, partNumber, bookNumber, testNumber, sectionId } = await request.json();

    if (!transcript || !question) {
      return NextResponse.json(
        { error: "transcript and question are required" },
        { status: 400 }
      );
    }

    // Get session and check daily speaking evaluation limit
    const { auth } = await import("@/lib/auth");
    const session = await auth();
    if (session?.user?.id) {
      const limit = await checkDailyLimit(session.user.id, "speakingEval");
      if (!limit.allowed) {
        return NextResponse.json({ error: limit.message }, { status: 429 });
      }
    }

    const message = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: `Part type: ${partType || "INTERVIEW"}\n\nQuestion: ${question}\n\nCandidate's response:\n${transcript}`,
        },
      ],
    });

    const text =
      message.content[0].type === "text" ? message.content[0].text : "";
    const result = JSON.parse(text);

    // Record usage after successful evaluation
    if (session?.user?.id) {
      await recordUsage(session.user.id, "speakingEval");
    }

    // Save attempt to DB (best-effort — don't fail the request if this errors)
    try {
      if (session?.user?.id) {
        const { default: dbConnect } = await import("@/lib/mongodb");
        const { default: UserAttempt } = await import("@/models/UserAttempt");
        const mongoose = await import("mongoose");
        await dbConnect();
        await UserAttempt.create({
          userId: new mongoose.Types.ObjectId(session.user.id),
          sectionType: "speaking",
          sectionId: sectionId
            ? new mongoose.Types.ObjectId(sectionId)
            : new mongoose.Types.ObjectId(),
          sectionModel: "SpeakingPart",
          bookNumber: bookNumber ?? null,
          testNumber: testNumber ?? null,
          bandScore: result.overallBand,
          speakingResponses: [{ partNumber: partNumber ?? 1, transcript }],
          speakingFeedback: {
            bandScore: result.overallBand,
            fluencyCoherence: result.criteria.fluencyCoherence,
            lexicalResource: result.criteria.lexicalResource,
            grammaticalRange: result.criteria.grammaticalRange,
            pronunciation: result.criteria.pronunciation,
            overallFeedback: result.overallFeedback,
          },
          completedAt: new Date(),
          mode: "practice",
        });
      }
    } catch (saveErr) {
      console.error("[speaking/evaluate] DB save error:", saveErr);
    }

    return NextResponse.json(result);
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Evaluation failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

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
    const { transcript, question, partType } = await request.json();

    if (!transcript || !question) {
      return NextResponse.json(
        { error: "transcript and question are required" },
        { status: 400 }
      );
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

    return NextResponse.json(result);
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Evaluation failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

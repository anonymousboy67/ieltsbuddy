import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export interface WritingEvaluation {
  overallBand: number;
  taskAchievement: { band: number; feedback: string };
  coherenceCohesion: { band: number; feedback: string };
  lexicalResource: { band: number; feedback: string };
  grammaticalRange: { band: number; feedback: string };
  strengths: string[];
  improvements: string[];
  correctedVersion: string;
}

export async function evaluateWriting(
  taskInstructions: string,
  studentResponse: string,
  taskType: "task1" | "task2"
): Promise<WritingEvaluation> {
  const message = await anthropic.messages.create({
    model: "claude-3-haiku-20240307",
    max_tokens: 2048,
    system: "You are an expert IELTS examiner. You MUST respond with ONLY valid JSON. No markdown, no code blocks, no extra text before or after the JSON.",
    messages: [
      {
        role: "user",
        content: `Evaluate the following IELTS Writing ${taskType === "task1" ? "Task 1" : "Task 2"} response based on official IELTS band descriptors.

Task Instructions:
${taskInstructions}

Student Response:
${studentResponse}

Respond with ONLY this JSON structure, nothing else:
{"overallBand": <number 0-9 in 0.5 increments>, "taskAchievement": {"band": <number>, "feedback": "<2-3 sentences>"}, "coherenceCohesion": {"band": <number>, "feedback": "<2-3 sentences>"}, "lexicalResource": {"band": <number>, "feedback": "<2-3 sentences>"}, "grammaticalRange": {"band": <number>, "feedback": "<2-3 sentences>"}, "strengths": ["<strength 1>", "<strength 2>", "<strength 3>"], "improvements": ["<improvement 1>", "<improvement 2>", "<improvement 3>"], "correctedVersion": "<improved version of the essay>"}`,
      },
    ],
  });

  const content = message.content[0];
  if (content.type !== "text") {
    throw new Error("Unexpected response type from Claude");
  }

  const rawText = content.text;
  console.log("[claude] Raw response:", rawText);

  // Attempt 1: direct parse
  try {
    console.log("[claude] Attempt 1: direct parse");
    return JSON.parse(rawText) as WritingEvaluation;
  } catch (e) {
    console.log("[claude] Attempt 1 failed:", (e as Error).message);
  }

  // Attempt 2: strip code fences, extract { ... }
  let cleaned = rawText.trim();
  const fenceMatch = cleaned.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenceMatch) {
    cleaned = fenceMatch[1].trim();
  }
  const braceMatch = cleaned.match(/\{[\s\S]*\}/);
  if (braceMatch) {
    cleaned = braceMatch[0];
  }

  try {
    console.log("[claude] Attempt 2: cleaned parse");
    return JSON.parse(cleaned) as WritingEvaluation;
  } catch (e) {
    console.log("[claude] Attempt 2 failed:", (e as Error).message);
  }

  // Attempt 3: fix literal newlines inside JSON string values
  // Replace newlines that appear inside quoted strings with \\n
  try {
    console.log("[claude] Attempt 3: fixing newlines in strings");
    const fixed = cleaned.replace(/"([^"]*)"(?=\s*[,:\]}])/gs, (_match, value: string) => {
      const escaped = value.replace(/\n/g, "\\n").replace(/\r/g, "\\r").replace(/\t/g, "\\t");
      return `"${escaped}"`;
    });
    return JSON.parse(fixed) as WritingEvaluation;
  } catch (e) {
    console.error("[claude] Attempt 3 failed:", (e as Error).message);
    console.error("[claude] All parse attempts failed. Raw text:", rawText);
    throw new Error("Failed to parse evaluation response");
  }
}

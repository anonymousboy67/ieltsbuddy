import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export interface StudyPlanTask {
  skill: "speaking" | "writing" | "reading" | "listening";
  taskTitle: string;
  duration: string;
  description: string;
  priority: "high" | "medium" | "low";
}

export interface DayPlan {
  day: string;
  tasks: StudyPlanTask[];
}

export interface StudyPlan {
  weeklyPlan: DayPlan[];
  focusAreas: string[];
  estimatedBandImprovement: number;
  tips: string[];
}

export async function generateStudyPlan(params: {
  targetBand: number;
  currentLevel: string;
  weaknesses: string[];
  dailyStudyTime: string;
  testDate?: Date;
}): Promise<StudyPlan> {
  const { targetBand, currentLevel, weaknesses, dailyStudyTime, testDate } = params;

  const daysUntilTest = testDate
    ? Math.ceil((new Date(testDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null;

  const message = await anthropic.messages.create({
    model: "claude-3-haiku-20240307",
    max_tokens: 2048,
    system:
      "You are an expert IELTS study planner. Generate a personalized weekly study plan based on the student's profile. Return ONLY valid JSON, no markdown, no code blocks. Use this exact structure: { \"weeklyPlan\": [{ \"day\": \"Monday\", \"tasks\": [{ \"skill\": \"speaking\"|\"writing\"|\"reading\"|\"listening\", \"taskTitle\": string, \"duration\": string, \"description\": string, \"priority\": \"high\"|\"medium\"|\"low\" }] }], \"focusAreas\": [string], \"estimatedBandImprovement\": number, \"tips\": [string] }. Prioritize the student's weak areas. If daily study time is 15min give 1-2 tasks per day, 30min give 2-3, 1hour give 3-4, 2hours give 5-6. Include all 7 days Monday through Sunday.",
    messages: [
      {
        role: "user",
        content: `Create a weekly IELTS study plan for a student with:
- Target band: ${targetBand}
- Current level: ${currentLevel}
- Weak areas: ${weaknesses.length > 0 ? weaknesses.join(", ") : "none specified"}
- Daily study time: ${dailyStudyTime}
${daysUntilTest ? `- Days until test: ${daysUntilTest}` : "- No test date set yet"}

Return ONLY the JSON object.`,
      },
    ],
  });

  const content = message.content[0];
  if (content.type !== "text") {
    throw new Error("Unexpected response type");
  }

  let jsonText = content.text.trim();

  // Strip code fences
  const fenceMatch = jsonText.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenceMatch) {
    jsonText = fenceMatch[1].trim();
  }

  let parsed: StudyPlan;

  // Try direct parse
  try {
    parsed = JSON.parse(jsonText) as StudyPlan;
  } catch {
    // Extract JSON between braces
    const braceMatch = jsonText.match(/\{[\s\S]*\}/);
    if (braceMatch) {
      try {
        parsed = JSON.parse(braceMatch[0]) as StudyPlan;
      } catch {
        const fixed = braceMatch[0].replace(/"([^"]*)"/g, (_m, v: string) => {
          return `"${v.replace(/\n/g, "\\n").replace(/\r/g, "\\r")}"`;
        });
        parsed = JSON.parse(fixed) as StudyPlan;
      }
    } else {
      throw new Error("Failed to parse study plan response");
    }
  }

  // Sanitize: map invalid skill values to valid ones
  const validSkills = new Set(["speaking", "writing", "reading", "listening"]);
  const skillMap: Record<string, StudyPlanTask["skill"]> = {
    vocabulary: "reading",
    grammar: "writing",
    pronunciation: "speaking",
    comprehension: "listening",
    fluency: "speaking",
  };

  for (const day of parsed.weeklyPlan) {
    for (const task of day.tasks) {
      if (!validSkills.has(task.skill)) {
        task.skill = skillMap[task.skill] || "reading";
      }
    }
  }

  return parsed;
}

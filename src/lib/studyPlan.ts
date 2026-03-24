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

interface LlmStudyGuide {
  welcomeMessage: string;
  focusAreas: string[];
  weeklyRoutine: {
    mondayToFriday: string;
    weekend: string;
  };
  milestones: Array<{ week: number; goal: string }>;
  resourceRecommendations: string[];
}

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

function estimateCurrentScore(level: string): number {
  const normalized = (level || "").toLowerCase();
  if (normalized === "beginner") return 4.5;
  if (normalized === "intermediate") return 5.5;
  if (normalized === "advanced") return 6.5;
  return 5.0;
}

function mapDailyToWeeklyHours(dailyStudyTime: string): number {
  if (dailyStudyTime === "15min") return 2;
  if (dailyStudyTime === "30min") return 4;
  if (dailyStudyTime === "1hour") return 7;
  if (dailyStudyTime === "2hours") return 14;
  return 4;
}

function pickSkill(text: string): StudyPlanTask["skill"] {
  const t = text.toLowerCase();
  if (t.includes("speak") || t.includes("fluency") || t.includes("pronunciation")) {
    return "speaking";
  }
  if (t.includes("essay") || t.includes("write") || t.includes("grammar")) {
    return "writing";
  }
  if (t.includes("listen") || t.includes("audio")) {
    return "listening";
  }
  return "reading";
}

function splitIntoTasks(text: string): string[] {
  return text
    .split(/\.|;|\n|\|/g)
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 3);
}

function toStudyTasks(lines: string[], defaultDuration: string): StudyPlanTask[] {
  return lines.map((line, index) => ({
    skill: pickSkill(line),
    taskTitle: line.length > 72 ? `${line.slice(0, 69)}...` : line,
    duration: defaultDuration,
    description: line,
    priority: index === 0 ? "high" : "medium",
  }));
}

function stripCodeFences(text: string): string {
  const trimmed = text.trim();
  const fenceMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  return fenceMatch ? fenceMatch[1].trim() : trimmed;
}

function parseLlmJson(content: string): LlmStudyGuide {
  const cleaned = stripCodeFences(content);
  let parsed: Partial<LlmStudyGuide>;

  try {
    parsed = JSON.parse(cleaned) as Partial<LlmStudyGuide>;
  } catch {
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (!match) {
      throw new Error("OpenRouter did not return JSON content");
    }
    parsed = JSON.parse(match[0]) as Partial<LlmStudyGuide>;
  }

  return {
    welcomeMessage:
      typeof parsed.welcomeMessage === "string"
        ? parsed.welcomeMessage
        : "Your personalized IELTS plan is ready. Stay consistent this week.",
    focusAreas: Array.isArray(parsed.focusAreas) ? parsed.focusAreas.map(String) : [],
    weeklyRoutine: {
      mondayToFriday:
        typeof parsed.weeklyRoutine?.mondayToFriday === "string"
          ? parsed.weeklyRoutine.mondayToFriday
          : "Do one reading passage and one focused weakness drill.",
      weekend:
        typeof parsed.weeklyRoutine?.weekend === "string"
          ? parsed.weeklyRoutine.weekend
          : "Take one mini mock test and review mistakes carefully.",
    },
    milestones: Array.isArray(parsed.milestones)
      ? parsed.milestones
          .map((m) => ({ week: Number(m.week) || 1, goal: String(m.goal || "Progress checkpoint") }))
          .slice(0, 8)
      : [],
    resourceRecommendations: Array.isArray(parsed.resourceRecommendations)
      ? parsed.resourceRecommendations.map(String)
      : [],
  };
}

function toLegacyPlan(guide: LlmStudyGuide): StudyPlan {
  const weekdays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
  const weekendDays = ["Saturday", "Sunday"];
  const weekdayTasks = toStudyTasks(splitIntoTasks(guide.weeklyRoutine.mondayToFriday), "45m");
  const weekendTasks = toStudyTasks(splitIntoTasks(guide.weeklyRoutine.weekend), "60m");

  const weeklyPlan: DayPlan[] = [
    ...weekdays.map((day) => ({ day, tasks: weekdayTasks })),
    ...weekendDays.map((day) => ({ day, tasks: weekendTasks })),
  ];

  const milestoneBoost = Math.min(1.0, Math.max(0.2, guide.milestones.length * 0.15));

  return {
    weeklyPlan,
    focusAreas: Array.isArray(guide.focusAreas) ? guide.focusAreas.slice(0, 5) : [],
    estimatedBandImprovement: Number(milestoneBoost.toFixed(1)),
    tips: [guide.welcomeMessage, ...(guide.resourceRecommendations || [])].filter(Boolean),
  };
}

export async function generateStudyPlan(params: {
  targetBand: number;
  currentLevel: string;
  weaknesses: string[];
  dailyStudyTime: string;
  testDate?: Date;
}): Promise<StudyPlan> {
  const { targetBand, currentLevel, weaknesses, dailyStudyTime, testDate } = params;

  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error("OPENROUTER_API_KEY is missing");
  }

  const model = process.env.OPENROUTER_MODEL || "meta-llama/llama-3.1-8b-instruct";

  const daysUntilTest = testDate
    ? Math.ceil((new Date(testDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null;

  const currentScore = estimateCurrentScore(currentLevel);
  const studyHoursPerWeek = mapDailyToWeeklyHours(dailyStudyTime);
  const examDateText = daysUntilTest ? `In ${Math.max(1, Math.ceil(daysUntilTest / 7))} weeks` : "Not set";
  const scoreSource = "Onboarding Self-Assessment";

  const systemPrompt = `You are an expert, world-class IELTS tutor. Your job is to create a highly structured, actionable study plan for a student based on their onboarding data.

CRITICAL INSTRUCTIONS:
1. You MUST output your response in raw, valid JSON format only.
2. Do not include any conversational text, markdown formatting blocks (like \`\`\`json), or greetings. Just the raw JSON object.
3. Be encouraging but realistic based on the time they have before their test.
4. Focus heavily on their stated weaknesses.`;

  const userPrompt = `Create a personalized IELTS study guide based on the following student profile:

STUDENT PROFILE:
- Target Band Score: ${targetBand}
- Current Estimated Band Score: ${currentScore} (Source: ${scoreSource})
- Exam Date: ${examDateText}
- Study Time Available: ${studyHoursPerWeek} hours per week
- Weakest Sections: ${weaknesses.length ? weaknesses.join(", ") : "Not specified"}

EXPECTED JSON SCHEMA:
{
  "welcomeMessage": "A short, encouraging 2-sentence message acknowledging their current score and target.",
  "focusAreas": ["A brief list of 3 specific things they must improve based on their weaknesses"],
  "weeklyRoutine": {
    "mondayToFriday": "Specific daily tasks (e.g., 'Do 1 Reading Passage, Review Vocabulary')",
    "weekend": "Specific weekend tasks (e.g., 'Take 1 Full Mock Test, Write 2 Essays')"
  },
  "milestones": [
    { "week": 1, "goal": "A realistic milestone for week 1" },
    { "week": 2, "goal": "A realistic milestone for week 2" }
  ],
  "resourceRecommendations": ["List of 2-3 specific types of practice materials they should use"]
}`;

  const response = await fetch(OPENROUTER_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
      "X-Title": "IELTSBuddy",
    },
    body: JSON.stringify({
      model,
      temperature: 0.3,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`OpenRouter request failed (${response.status}): ${text}`);
  }

  const json = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };

  const content = json.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error("OpenRouter returned an empty response");
  }

  const guide = parseLlmJson(content);
  return toLegacyPlan(guide);
}

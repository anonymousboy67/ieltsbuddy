import DailyUsage from "@/models/DailyUsage";
import dbConnect from "@/lib/mongodb";

export type ActionType = "gemini" | "mockTest" | "writingEval" | "speakingEval";

const DAILY_LIMITS = {
  gemini: 1,         // 1 session per day (12 min)
  mockTest: 1,       // 1 full mock test per day
  writingEval: 2,    // 2 writing evaluations per day
  speakingEval: 2,   // 2 speaking evaluations per day
};

function getTodayDate(): string {
  return new Date().toISOString().split("T")[0]; // "YYYY-MM-DD"
}

async function getOrCreateUsage(userId: string) {
  await dbConnect();
  const date = getTodayDate();

  let usage = await DailyUsage.findOne({ userId, date });
  if (!usage) {
    usage = await DailyUsage.create({ userId, date });
  }
  return usage;
}

export async function checkDailyLimit(
  userId: string,
  action: ActionType
): Promise<{ allowed: boolean; message: string; remaining: number }> {
  const usage = await getOrCreateUsage(userId);

  switch (action) {
    case "gemini": {
      if (usage.geminiSessionUsed) {
        return { allowed: false, message: "Daily live speaking session limit reached. Come back tomorrow.", remaining: 0 };
      }
      return { allowed: true, message: "", remaining: 1 };
    }
    case "mockTest": {
      if (usage.mockTestsToday >= DAILY_LIMITS.mockTest) {
        return { allowed: false, message: "Daily mock test limit reached. Come back tomorrow.", remaining: 0 };
      }
      return { allowed: true, message: "", remaining: DAILY_LIMITS.mockTest - usage.mockTestsToday };
    }
    case "writingEval": {
      if (usage.writingEvalsToday >= DAILY_LIMITS.writingEval) {
        return { allowed: false, message: "Daily writing evaluation limit reached. Come back tomorrow.", remaining: 0 };
      }
      return { allowed: true, message: "", remaining: DAILY_LIMITS.writingEval - usage.writingEvalsToday };
    }
    case "speakingEval": {
      if (usage.speakingEvalsToday >= DAILY_LIMITS.speakingEval) {
        return { allowed: false, message: "Daily speaking evaluation limit reached. Come back tomorrow.", remaining: 0 };
      }
      return { allowed: true, message: "", remaining: DAILY_LIMITS.speakingEval - usage.speakingEvalsToday };
    }
  }
}

export async function recordUsage(userId: string, action: ActionType): Promise<void> {
  await dbConnect();
  const date = getTodayDate();

  const update: Record<string, unknown> = {};
  switch (action) {
    case "gemini":
      update.geminiSessionUsed = true;
      break;
    case "mockTest":
      update.$inc = { mockTestsToday: 1 };
      break;
    case "writingEval":
      update.$inc = { writingEvalsToday: 1 };
      break;
    case "speakingEval":
      update.$inc = { speakingEvalsToday: 1 };
      break;
  }

  await DailyUsage.findOneAndUpdate(
    { userId, date },
    action === "gemini" ? { $set: update } : update,
    { upsert: true }
  );
}

export async function getTodayUsage(userId: string) {
  const usage = await getOrCreateUsage(userId);
  return {
    geminiSessionUsed: usage.geminiSessionUsed,
    mockTestsToday: usage.mockTestsToday,
    writingEvalsToday: usage.writingEvalsToday,
    speakingEvalsToday: usage.speakingEvalsToday,
    limits: DAILY_LIMITS,
  };
}

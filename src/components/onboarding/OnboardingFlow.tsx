"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { ArrowLeft } from "lucide-react";
import BandScore from "./steps/BandScore";
import TestType from "./steps/TestType";
import TestDate from "./steps/TestDate";
import EnglishLevel from "./steps/EnglishLevel";
import Challenges from "./steps/Challenges";
import StudyTime from "./steps/StudyTime";
import Complete from "./steps/Complete";

const TOTAL_STEPS = 7;

const levelMap: Record<string, string> = {
  beginner: "beginner",
  intermediate: "intermediate",
  advanced: "advanced",
};

const studyTimeMap: Record<string, string> = {
  "15min": "15min",
  "30min": "30min",
  "1hr": "1hour",
  "2hr": "2hours",
  // Legacy label-based keys
  "15 min / day": "15min",
  "30 min / day": "30min",
  "1 hour / day": "1hour",
  "2+ hours / day": "2hours",
};

export default function OnboardingFlow() {
  const router = useRouter();
  const { update: updateSession } = useSession();
  const [step, setStep] = useState(1);
  const [band, setBand] = useState("");
  const [testType, setTestType] = useState("");
  const [booked, setBooked] = useState(false);
  const [testDate, setTestDate] = useState("");
  const [level, setLevel] = useState("");
  const [challenges, setChallenges] = useState<string[]>([]);
  const [studyTime, setStudyTime] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const progress = (step / TOTAL_STEPS) * 100;

  const handleContinue = async () => {
    if (step < TOTAL_STEPS) {
      setStep(step + 1);
    } else {
      setSubmitting(true);
      try {
        const res = await fetch("/api/onboarding", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            targetBand: band || "6.5",
            testType: testType === "general" ? "general" : "academic",
            testDate: booked && testDate ? testDate : undefined,
            currentLevel: levelMap[level.toLowerCase()] || "intermediate",
            weaknesses: challenges,
            dailyStudyTime: studyTimeMap[studyTime] || "30min",
          }),
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          console.error("Onboarding failed:", res.status, err);
          setSubmitting(false);
          return;
        }
        // Refresh JWT so middleware sees onboardingComplete=true
        await updateSession();
        router.push("/dashboard");
      } catch (err) {
        console.error("Onboarding error:", err);
        setSubmitting(false);
      }
    }
  };

  return (
    <div className="flex min-h-dvh flex-col bg-[#0B0F1A]">
      <div className="flex items-center gap-3 px-4 pt-4 md:px-6">
        {step > 1 ? (
          <button
            onClick={() => setStep(step - 1)}
            className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border-[0.5px] border-[#2A3150] bg-[#1E2540] transition-all duration-200 hover:border-[rgba(99,102,241,0.3)]"
            aria-label="Go back"
          >
            <ArrowLeft size={20} strokeWidth={1.75} className="text-[#94A3B8]" />
          </button>
        ) : (
          <div className="h-10 w-10" />
        )}
        <div className="flex-1">
          <div className="relative h-[3px] w-full rounded-full bg-[#1E2540]">
            <div
              className="progress-glow-bar relative h-[3px] rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            >
              <div className="progress-shimmer absolute inset-0 overflow-hidden rounded-full">
                <div className="h-full w-1/2 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
              </div>
              <div className="progress-glow-dot absolute -right-[3px] top-1/2 h-1.5 w-1.5 -translate-y-1/2 rounded-full bg-white" />
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pt-8 pb-28 md:px-6">
        <div className="mx-auto max-w-lg">
          <div key={step} className="animate-step-enter">
            {step === 1 && <BandScore value={band} onChange={setBand} />}
            {step === 2 && <TestType value={testType} onChange={setTestType} />}
            {step === 3 && (
              <TestDate
                booked={booked}
                onBookedChange={setBooked}
                date={testDate}
                onDateChange={setTestDate}
              />
            )}
            {step === 4 && <EnglishLevel value={level} onChange={setLevel} />}
            {step === 5 && (
              <Challenges value={challenges} onChange={setChallenges} />
            )}
            {step === 6 && <StudyTime value={studyTime} onChange={setStudyTime} />}
            {step === 7 && <Complete band={band} />}
          </div>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-[#0B0F1A] px-4 pb-6 pt-3 md:px-6">
        <div className="mx-auto max-w-lg">
          <button
            onClick={handleContinue}
            disabled={submitting}
            className="w-full cursor-pointer rounded-xl bg-[#6366F1] py-3.5 text-[15px] font-medium text-white transition-colors duration-200 hover:bg-[#818CF8] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting ? "Setting up..." : step === TOTAL_STEPS ? "Let's get started!" : "Continue"}
          </button>
        </div>
      </div>
    </div>
  );
}

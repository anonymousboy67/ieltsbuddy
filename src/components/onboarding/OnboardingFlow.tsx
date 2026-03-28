"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2 } from "lucide-react";
import BandScore from "./steps/BandScore";
import TestType from "./steps/TestType";
import TestDate from "./steps/TestDate";
import EnglishLevel from "./steps/EnglishLevel";
import Challenges from "./steps/Challenges";
import StudyTime from "./steps/StudyTime";
import DiagnosticQuiz from "./steps/DiagnosticQuiz";
import StudyPlanReady from "./steps/StudyPlanReady";

// Step 7 is the diagnostic quiz, step 8 is the AI analysis screen, step 9 is the result
const TOTAL_STEPS = 9;

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
  "15 min / day": "15min",
  "30 min / day": "30min",
  "1 hour / day": "1hour",
  "2+ hours / day": "2hours",
};

export default function OnboardingFlow() {
  const { update } = useSession();
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [band, setBand] = useState("");
  const [testType, setTestType] = useState("");
  const [booked, setBooked] = useState(false);
  const [testDate, setTestDate] = useState("");
  const [level, setLevel] = useState("");
  const [challenges, setChallenges] = useState<string[]>([]);
  const [studyTime, setStudyTime] = useState("");
  const [diagnosticAnswers, setDiagnosticAnswers] = useState<Record<number, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);

  // Study plan result state
  const [estimatedBand, setEstimatedBand] = useState(5.5);
  const [focusAreas, setFocusAreas] = useState<string[]>([]);
  const [detectedWeaknesses, setDetectedWeaknesses] = useState<string[]>([]);

  const progress = (step / TOTAL_STEPS) * 100;

  const runDiagnosticAnalysis = async () => {
    setAnalyzing(true);
    try {
      // Step 1: Save the profile data
      await fetch("/api/onboarding", {
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

      // Step 2: Run AI diagnostic
      const res = await fetch("/api/diagnostic/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          answers: diagnosticAnswers,
          targetBand: parseFloat(band) || 6.5,
          currentLevel: levelMap[level.toLowerCase()] || "intermediate",
          weaknesses: challenges,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setEstimatedBand(data.estimatedBand ?? 5.5);
        setFocusAreas(data.focusAreas ?? []);
        setDetectedWeaknesses(data.detectedWeaknesses ?? challenges);
      }
    } catch (err) {
      console.error("Diagnostic analysis error:", err);
      // Fallback defaults - still advance to result step
      setEstimatedBand(5.5);
      setFocusAreas(challenges.length > 0 ? challenges : ["Reading", "Writing"]);
      setDetectedWeaknesses(challenges);
    } finally {
      setAnalyzing(false);
      setStep(9); // Jump to StudyPlanReady
    }
  };

  const handleContinue = async () => {
    if (step === 7) {
      // After quiz — run AI analysis then jump to step 9
      setStep(8); // Show loading step
      await runDiagnosticAnalysis();
      return;
    }

    if (step === 9) {
      // Final step — refresh session and go to dashboard
      setSubmitting(true);
      try {
        await update();
        router.replace("/dashboard");
      } catch (err) {
        console.error("Final redirect error:", err);
        setSubmitting(false);
      }
      return;
    }

    if (step < TOTAL_STEPS) {
      setStep(step + 1);
    }
  };

  const canContinue = () => {
    if (step === 8) return false; // Loading — no button
    if (step === 7 && Object.keys(diagnosticAnswers).length < 3) return false;
    return true;
  };

  const buttonLabel = () => {
    if (step === 7) return "Analyse My Level →";
    if (step === 9) return submitting ? "Setting up..." : "Go to My Dashboard 🚀";
    return "Continue";
  };

  return (
    <div className="flex min-h-dvh flex-col bg-[#0B0F1A]">
      <div className="flex items-center gap-3 px-4 pt-4 md:px-6">
        {step > 1 && step !== 8 && step !== 9 ? (
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
            {step === 7 && (
              <DiagnosticQuiz
                answers={diagnosticAnswers}
                onChange={setDiagnosticAnswers}
              />
            )}
            {step === 8 && (
              <div className="flex flex-col items-center justify-center gap-6 py-20 text-center">
                <div className="relative flex h-24 w-24 items-center justify-center">
                  <div className="absolute inset-0 animate-ping rounded-full bg-[rgba(99,102,241,0.15)]" />
                  <div className="flex h-24 w-24 items-center justify-center rounded-full bg-[rgba(99,102,241,0.12)] border-[0.5px] border-[rgba(99,102,241,0.3)]">
                    <Loader2 size={36} strokeWidth={1.5} className="animate-spin text-[#6366F1]" />
                  </div>
                </div>
                <div>
                  <h2 className="font-heading text-2xl font-bold text-[#F8FAFC]">
                    Analysing Your Level...
                  </h2>
                  <p className="mt-2 text-sm text-[#94A3B8]">
                    Our AI is evaluating your answers and building your personalised 7-day study plan.
                  </p>
                </div>
                <div className="flex gap-1.5">
                  {[0, 1, 2].map((i) => (
                    <div
                      key={i}
                      className="h-2 w-2 animate-bounce rounded-full bg-[#6366F1]"
                      style={{ animationDelay: `${i * 0.15}s` }}
                    />
                  ))}
                </div>
              </div>
            )}
            {step === 9 && (
              <StudyPlanReady
                band={band}
                weaknesses={detectedWeaknesses}
                estimatedBand={estimatedBand}
                focusAreas={focusAreas}
              />
            )}
          </div>
        </div>
      </div>

      {/* Bottom CTA — hidden during loading */}
      {step !== 8 && (
        <div className="fixed bottom-0 left-0 right-0 bg-[#0B0F1A] px-4 pb-6 pt-3 md:px-6">
          <div className="mx-auto max-w-lg">
            <button
              onClick={handleContinue}
              disabled={!canContinue() || submitting || analyzing}
              className="w-full cursor-pointer rounded-xl bg-[#6366F1] py-3.5 text-[15px] font-medium text-white transition-colors duration-200 hover:bg-[#818CF8] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {buttonLabel()}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Clock,
  ChevronLeft,
  ChevronRight,
  BarChart3,
  Star,
  TrendingUp,
  BookOpen,
  Loader2,
  RotateCcw,
} from "lucide-react";
import MicVisualizer from "./MicVisualizer";
import QuestionCard from "./QuestionCard";

/* ── Types ────────────────────────────────────────────────────── */

interface SpeakingQuestion {
  questionNumber: number;
  questionText: string;
}

interface SampleAnswer {
  questionNumber?: number;
  answerText: string;
}

interface SpeakingPart {
  _id: string;
  bookNumber: number;
  testNumber: number;
  partNumber: number;
  partType: "INTERVIEW" | "CUE_CARD" | "DISCUSSION";
  topic?: string;
  instructions?: string;
  questions?: SpeakingQuestion[];
  cueCardPrompts?: string[];
  cueCardFinalPrompt?: string;
  prepTime?: number;
  speakTime?: number;
  sampleAnswers?: SampleAnswer[];
}

interface CriteriaScore {
  score: number;
  feedback: string;
}

interface EvalResult {
  overallBand: number;
  criteria: {
    fluencyCoherence: CriteriaScore;
    lexicalResource: CriteriaScore;
    grammaticalRange: CriteriaScore;
    pronunciation: CriteriaScore;
  };
  overallFeedback: string;
  improvements: string[];
}

type MicState = "idle" | "listening" | "processing";
type Phase = "prep" | "speak" | "idle";

/* eslint-disable @typescript-eslint/no-explicit-any */
type SpeechRecognitionAny = any;

interface SpeakingTestInterfaceProps {
  bookNumber: number;
  testNumber: number;
}

/* ── Helpers ──────────────────────────────────────────────────── */

function formatTime(s: number): string {
  const m = Math.floor(s / 60).toString().padStart(2, "0");
  const sec = (s % 60).toString().padStart(2, "0");
  return `${m}:${sec}`;
}

const CRITERIA_LABELS: Record<string, string> = {
  fluencyCoherence: "Fluency & Coherence",
  lexicalResource: "Lexical Resource",
  grammaticalRange: "Grammatical Range & Accuracy",
  pronunciation: "Pronunciation",
};

/* ── Component ────────────────────────────────────────────────── */

export default function SpeakingTestInterface({
  bookNumber,
  testNumber,
}: SpeakingTestInterfaceProps) {
  // Data
  const [parts, setParts] = useState<SpeakingPart[]>([]);
  const [loading, setLoading] = useState(true);

  // Navigation
  const [partIdx, setPartIdx] = useState(0);
  const [qIdx, setQIdx] = useState(0);

  // Recording
  const [micState, setMicState] = useState<MicState>("idle");
  const [transcript, setTranscript] = useState("");
  const [recordDuration, setRecordDuration] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recognitionRef = useRef<SpeechRecognitionAny | null>(null);
  const durationIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Part 2 timer
  const [phase, setPhase] = useState<Phase>("idle");
  const [countdown, setCountdown] = useState(0);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Evaluation
  const [evalResult, setEvalResult] = useState<EvalResult | null>(null);
  const [showSample, setShowSample] = useState(false);

  const part = parts[partIdx] ?? null;
  const isCueCard = part?.partType === "CUE_CARD";

  // Build question list from part
  const questions: string[] = (() => {
    if (!part) return [];
    if (part.partType === "CUE_CARD") {
      const prompts = part.cueCardPrompts || [];
      const main = part.questions?.[0]?.questionText || part.topic || "";
      const bullets = prompts.length > 0 ? `\n\nYou should say:\n${prompts.map((p) => `- ${p}`).join("\n")}` : "";
      const final = part.cueCardFinalPrompt ? `\n\n${part.cueCardFinalPrompt}` : "";
      return [`${main}${bullets}${final}`];
    }
    return (part.questions || []).map((q) => q.questionText);
  })();

  const totalQ = questions.length;
  const currentQuestion = questions[qIdx] || "";

  /* ── Fetch data ─────────────────────────────────────────────── */

  useEffect(() => {
    fetch("/api/content/speaking")
      .then((r) => r.json())
      .then((data: SpeakingPart[]) => {
        const filtered = data.filter(
          (p) => p.bookNumber === bookNumber && p.testNumber === testNumber
        );
        filtered.sort((a, b) => a.partNumber - b.partNumber);
        setParts(filtered);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [bookNumber, testNumber]);

  /* ── Cleanup on unmount ─────────────────────────────────────── */

  useEffect(() => {
    return () => {
      stopRecording();
      clearCountdown();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ── Recording ──────────────────────────────────────────────── */

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
    mediaRecorderRef.current = null;

    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }

    if (durationIntervalRef.current) {
      clearInterval(durationIntervalRef.current);
      durationIntervalRef.current = null;
    }
  }, []);

  const startRecording = useCallback(async () => {
    setTranscript("");
    setRecordDuration(0);
    setEvalResult(null);
    setShowSample(false);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;

      recorder.onstart = () => {
        setMicState("listening");
      };

      recorder.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
      };

      recorder.start();

      // Duration counter
      durationIntervalRef.current = setInterval(() => {
        setRecordDuration((d) => d + 1);
      }, 1000);

      // Speech recognition
      const SpeechRecognitionCtor =
        (window as any).webkitSpeechRecognition ||
        (window as any).SpeechRecognition;

      if (SpeechRecognitionCtor) {
        const recognition = new SpeechRecognitionCtor();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = "en-US";

        let finalTranscript = "";

        recognition.onresult = (event: any) => {
          let interim = "";
          for (let i = event.resultIndex; i < event.results.length; i++) {
            if (event.results[i].isFinal) {
              finalTranscript += event.results[i][0].transcript + " ";
            } else {
              interim += event.results[i][0].transcript;
            }
          }
          setTranscript(finalTranscript + interim);
        };

        recognition.onerror = () => {
          // speech recognition error — keep recording, transcript may be partial
        };

        recognition.onend = () => {
          // Restart if still listening (Chrome stops after silence)
          if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
            try {
              recognition.start();
            } catch {
              // already started
            }
          }
        };

        recognitionRef.current = recognition;
        recognition.start();
      }
    } catch {
      setMicState("idle");
    }
  }, []);

  const handleMicToggle = useCallback(() => {
    if (micState === "listening") {
      stopRecording();
      setMicState("idle");
      // Clear cue card countdown if running
      clearCountdown();
      setPhase("idle");
    } else if (micState === "idle") {
      if (isCueCard && phase === "idle") {
        // Start prep phase first
        startPrepPhase();
      } else {
        startRecording();
      }
    }
  }, [micState, isCueCard, phase, startRecording, stopRecording]);

  /* ── Part 2 countdown ───────────────────────────────────────── */

  function clearCountdown() {
    if (countdownRef.current) {
      clearInterval(countdownRef.current);
      countdownRef.current = null;
    }
  }

  function startPrepPhase() {
    const prepTime = part?.prepTime || 60;
    setPhase("prep");
    setCountdown(prepTime);

    countdownRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearCountdown();
          startSpeakPhase();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }

  function startSpeakPhase() {
    setPhase("speak");
    const speakTime = part?.speakTime || 120;
    setCountdown(speakTime);
    startRecording();

    countdownRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearCountdown();
          stopRecording();
          setMicState("idle");
          setPhase("idle");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }

  /* ── Evaluate ───────────────────────────────────────────────── */

  async function handleEvaluate() {
    if (!transcript.trim()) return;
    setMicState("processing");

    try {
      const res = await fetch("/api/speaking/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transcript: transcript.trim(),
          question: currentQuestion,
          partType: part?.partType || "INTERVIEW",
        }),
      });

      if (res.ok) {
        const data: EvalResult = await res.json();
        setEvalResult(data);
      }
    } catch {
      // evaluation failed
    } finally {
      setMicState("idle");
    }
  }

  /* ── Navigation ─────────────────────────────────────────────── */

  function changePart(idx: number) {
    stopRecording();
    clearCountdown();
    setPartIdx(idx);
    setQIdx(0);
    setMicState("idle");
    setTranscript("");
    setEvalResult(null);
    setShowSample(false);
    setPhase("idle");
    setRecordDuration(0);
  }

  function nextQuestion() {
    if (qIdx < totalQ - 1) {
      setQIdx(qIdx + 1);
      setTranscript("");
      setEvalResult(null);
      setShowSample(false);
      setRecordDuration(0);
      stopRecording();
      setMicState("idle");
    }
  }

  function prevQuestion() {
    if (qIdx > 0) {
      setQIdx(qIdx - 1);
      setTranscript("");
      setEvalResult(null);
      setShowSample(false);
      setRecordDuration(0);
      stopRecording();
      setMicState("idle");
    }
  }

  /* ── Get sample answer for current question ─────────────────── */

  const sampleAnswer = (() => {
    if (!part?.sampleAnswers || part.sampleAnswers.length === 0) return null;
    if (part.partType === "CUE_CARD") return part.sampleAnswers[0]?.answerText || null;
    const currentQNum = part.questions?.[qIdx]?.questionNumber;
    if (currentQNum) {
      const match = part.sampleAnswers.find((s) => s.questionNumber === currentQNum);
      if (match) return match.answerText;
    }
    return part.sampleAnswers[qIdx]?.answerText || null;
  })();

  /* ── Loading ────────────────────────────────────────────────── */

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 animate-pulse rounded-full bg-[#FDF8F2]" />
          <div className="h-5 w-48 animate-pulse rounded bg-[#FDF8F2]" />
        </div>
        <div className="h-12 animate-pulse rounded-xl bg-[#FDF8F2]" />
        <div className="h-40 animate-pulse rounded-xl bg-[#FDF8F2]" />
        <div className="h-32 animate-pulse rounded-xl bg-[#FDF8F2]" />
      </div>
    );
  }

  if (parts.length === 0) {
    return (
      <div className="flex min-h-[300px] flex-col items-center justify-center gap-4">
        <p className="text-[15px] text-[#57534E]">Test not found</p>
        <Link
          href="/dashboard/speaking"
          className="rounded-xl bg-[#047857] px-6 py-3 text-sm font-medium text-white hover:bg-[#0F766E]"
        >
          Back to Speaking
        </Link>
      </div>
    );
  }

  /* ── Results view ───────────────────────────────────────────── */

  if (evalResult) {
    const criteriaEntries = Object.entries(evalResult.criteria) as [
      string,
      CriteriaScore,
    ][];

    return (
      <div>
        {/* Header */}
        <div className="animate-fade-up flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard/speaking"
              className="flex h-10 w-10 items-center justify-center rounded-full border-[0.5px] border-[#E7E5E4] bg-[#FDF8F2] transition-all duration-200 hover:border-[rgba(4,120,87,0.28)]"
            >
              <ArrowLeft size={20} strokeWidth={1.75} className="text-[#57534E]" />
            </Link>
            <h1 className="text-base font-medium text-[#292524]">
              Speaking Results
            </h1>
          </div>
        </div>

        {/* Overall band */}
        <div className="animate-fade-up animate-fade-up-1 mt-6 flex flex-col items-center rounded-xl border-[0.5px] border-[#E7E5E4] bg-[#FDF8F2] p-6">
          <div className="flex h-24 w-24 items-center justify-center rounded-full border-4 border-[#047857] bg-[rgba(4,120,87,0.10)]">
            <span className="text-3xl font-bold text-[#292524]">
              {evalResult.overallBand}
            </span>
          </div>
          <p className="mt-3 text-sm font-medium text-[#57534E]">
            Overall Band Score
          </p>
        </div>

        {/* Criteria breakdown */}
        <div className="animate-fade-up animate-fade-up-2 mt-4 space-y-3">
          {criteriaEntries.map(([key, val]) => (
            <div
              key={key}
              className="rounded-xl border-[0.5px] border-[#E7E5E4] bg-[#FDF8F2] p-4"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <BarChart3
                    size={16}
                    strokeWidth={1.75}
                    className="text-[#047857]"
                  />
                  <span className="text-sm font-medium text-[#292524]">
                    {CRITERIA_LABELS[key] || key}
                  </span>
                </div>
                <span className="text-lg font-bold text-[#047857]">
                  {val.score}
                </span>
              </div>
              <div className="mt-2 h-1.5 w-full rounded-full bg-[#E7E5E4]">
                <div
                  className="h-1.5 rounded-full bg-[#047857] transition-all duration-500"
                  style={{ width: `${(val.score / 9) * 100}%` }}
                />
              </div>
              <p className="mt-2 text-xs text-[#57534E]">{val.feedback}</p>
            </div>
          ))}
        </div>

        {/* Overall feedback */}
        <div className="animate-fade-up animate-fade-up-3 mt-4 rounded-xl border-[0.5px] border-[#E7E5E4] bg-[#FDF8F2] p-4">
          <div className="flex items-center gap-2">
            <Star size={16} strokeWidth={1.75} className="text-[#B45309]" />
            <span className="text-sm font-medium text-[#292524]">
              Examiner Feedback
            </span>
          </div>
          <p className="mt-2 text-sm text-[#57534E]">
            {evalResult.overallFeedback}
          </p>
        </div>

        {/* Improvements */}
        {evalResult.improvements.length > 0 && (
          <div className="animate-fade-up animate-fade-up-4 mt-4 rounded-xl border-[0.5px] border-[#E7E5E4] bg-[#FDF8F2] p-4">
            <div className="flex items-center gap-2">
              <TrendingUp
                size={16}
                strokeWidth={1.75}
                className="text-[#047857]"
              />
              <span className="text-sm font-medium text-[#292524]">
                Areas for Improvement
              </span>
            </div>
            <ul className="mt-3 space-y-2">
              {evalResult.improvements.map((imp, i) => (
                <li
                  key={i}
                  className="flex items-start gap-2 text-sm text-[#57534E]"
                >
                  <span className="mt-1.5 h-1 w-1 flex-shrink-0 rounded-full bg-[#047857]" />
                  {imp}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Your transcript */}
        <div className="animate-fade-up animate-fade-up-5 mt-4 rounded-xl border-[0.5px] border-[#E7E5E4] bg-[#F8F5F1] p-4">
          <p className="text-xs font-medium text-[#78716C]">Your Response</p>
          <p className="mt-2 text-sm text-[#57534E]">{transcript}</p>
        </div>

        {/* Sample answer */}
        {sampleAnswer && (
          <div className="animate-fade-up animate-fade-up-6 mt-4">
            <button
              onClick={() => setShowSample(!showSample)}
              className="flex w-full items-center justify-center gap-2 rounded-xl border-[0.5px] border-[#E7E5E4] bg-[#FDF8F2] py-3 text-sm font-medium text-[#57534E] transition-all hover:border-[#047857] hover:text-stone-800"
            >
              <BookOpen size={16} strokeWidth={1.75} />
              {showSample ? "Hide Sample Answer" : "Show Sample Answer"}
            </button>
            {showSample && (
              <div className="mt-3 rounded-xl border-[0.5px] border-[rgba(4,120,87,0.28)] bg-[#FDF8F2] p-4">
                <p className="text-xs font-medium text-[#047857]">
                  Sample Answer
                </p>
                <p className="mt-2 whitespace-pre-wrap text-sm text-[#57534E]">
                  {sampleAnswer}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="mt-6 flex flex-col gap-3 pb-4 sm:flex-row">
          <button
            onClick={() => {
              setEvalResult(null);
              setTranscript("");
              setRecordDuration(0);
              setShowSample(false);
            }}
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border-[0.5px] border-[#E7E5E4] py-3 text-[15px] font-medium text-[#57534E] transition-all duration-200 hover:border-[#047857] hover:text-stone-800"
          >
            <RotateCcw size={16} strokeWidth={1.75} />
            Try Again
          </button>
          {qIdx < totalQ - 1 ? (
            <button
              onClick={nextQuestion}
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#047857] py-3 text-[15px] font-medium text-white transition-colors duration-200 hover:bg-[#0F766E]"
            >
              Next Question
              <ChevronRight size={18} strokeWidth={1.75} />
            </button>
          ) : partIdx < parts.length - 1 ? (
            <button
              onClick={() => changePart(partIdx + 1)}
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#047857] py-3 text-[15px] font-medium text-white transition-colors duration-200 hover:bg-[#0F766E]"
            >
              Next Part
              <ChevronRight size={18} strokeWidth={1.75} />
            </button>
          ) : (
            <Link
              href="/dashboard/speaking"
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#047857] py-3 text-[15px] font-medium text-white transition-colors duration-200 hover:bg-[#0F766E]"
            >
              Finish Test
            </Link>
          )}
        </div>
      </div>
    );
  }

  /* ── Test view ──────────────────────────────────────────────── */

  return (
    <div>
      {/* Header */}
      <div className="animate-fade-up flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/speaking"
            className="flex h-10 w-10 items-center justify-center rounded-full border-[0.5px] border-[#E7E5E4] bg-[#FDF8F2] transition-all duration-200 hover:border-[rgba(4,120,87,0.28)]"
          >
            <ArrowLeft size={20} strokeWidth={1.75} className="text-[#57534E]" />
          </Link>
          <h1 className="text-base font-medium text-[#292524]">
            Book {bookNumber} Test {testNumber} - Part {part?.partNumber}
          </h1>
        </div>
        <span className="flex items-center gap-1.5 text-sm text-[#78716C]">
          <Clock size={16} strokeWidth={1.75} />
          {phase !== "idle" ? formatTime(countdown) : formatTime(recordDuration)}
        </span>
      </div>

      {/* Part pills */}
      <div className="animate-fade-up animate-fade-up-1 mt-6 flex gap-2">
        {parts.map((p, i) => (
          <button
            key={p._id}
            onClick={() => changePart(i)}
            className={`cursor-pointer rounded-full px-4 py-1.5 text-[13px] font-medium transition-all duration-200 ${
              i === partIdx
                ? "bg-[#047857] text-white"
                : "bg-[#FDF8F2] text-[#57534E] hover:text-[#292524]"
            }`}
          >
            Part {p.partNumber}
          </button>
        ))}
      </div>

      {/* Instructions */}
      <p className="animate-fade-up animate-fade-up-2 mt-3 text-sm text-[#57534E]">
        {part?.instructions || (
          isCueCard
            ? "You will be given a topic card. You have 1 minute to prepare, then speak for 1-2 minutes."
            : part?.partType === "DISCUSSION"
              ? "The examiner will ask deeper questions related to the Part 2 topic."
              : "The examiner will ask general questions about yourself and familiar topics."
        )}
      </p>

      {/* Part 2 prep phase */}
      {isCueCard && phase === "prep" && (
        <div className="mt-5 animate-pulse rounded-xl border-[0.5px] border-[rgba(180,83,9,0.32)] bg-[rgba(180,83,9,0.10)] p-5 text-center">
          <p className="text-sm font-medium text-[#B45309]">Preparation Time</p>
          <p className="mt-1 font-mono text-3xl font-bold text-[#B45309]">
            {formatTime(countdown)}
          </p>
          <p className="mt-2 text-xs text-[#57534E]">
            Read the card and prepare your answer. Speaking will start automatically.
          </p>
        </div>
      )}

      {/* Part 2 speak phase indicator */}
      {isCueCard && phase === "speak" && (
        <div className="mt-3 flex items-center justify-center gap-2 text-sm">
          <span className="h-2 w-2 animate-pulse rounded-full bg-[#B91C1C]" />
          <span className="text-[#57534E]">Speaking time remaining:</span>
          <span className={`font-mono font-medium ${countdown < 30 ? "text-[#B91C1C]" : "text-[#292524]"}`}>
            {formatTime(countdown)}
          </span>
        </div>
      )}

      {/* Question card */}
      {totalQ > 0 && (
        <div key={`${partIdx}-${qIdx}`} className="animate-step-enter">
          <QuestionCard
            questionIndex={qIdx}
            totalQuestions={totalQ}
            questionText={currentQuestion}
          />
        </div>
      )}

      {/* Mic visualizer */}
      {phase !== "prep" && (
        <MicVisualizer
          state={micState}
          onToggle={handleMicToggle}
          duration={recordDuration}
        />
      )}

      {/* Cue card start button (initial state) */}
      {isCueCard && phase === "idle" && micState === "idle" && !transcript && (
        <div className="mt-6 flex justify-center">
          <button
            onClick={() => startPrepPhase()}
            className="rounded-xl bg-[#047857] px-8 py-3 text-[15px] font-medium text-white transition-colors hover:bg-[#0F766E]"
          >
            Start Preparation
          </button>
        </div>
      )}

      {/* Live transcript */}
      <div className="mt-6 rounded-xl bg-[#F8F5F1] p-4">
        <p className="text-sm font-medium text-[#78716C]">Your Response</p>
        {transcript ? (
          <p className="mt-2 text-sm text-[#292524]">{transcript}</p>
        ) : (
          <p className="mt-2 text-sm italic text-[#57534E]">
            {micState === "listening"
              ? "Listening... speak now"
              : "Your spoken response will appear here after you start speaking..."}
          </p>
        )}
      </div>

      {/* Evaluate button */}
      {transcript.trim() && micState !== "listening" && (
        <button
          onClick={handleEvaluate}
          disabled={micState === "processing"}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-[#047857] py-3.5 text-[15px] font-medium text-white transition-colors duration-200 hover:bg-[#0F766E] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {micState === "processing" ? (
            <>
              <Loader2 size={18} strokeWidth={1.75} className="animate-spin" />
              Evaluating...
            </>
          ) : (
            <>
              <BarChart3 size={18} strokeWidth={1.75} />
              Get AI Evaluation
            </>
          )}
        </button>
      )}

      {/* Question navigation (non-cue-card) */}
      {!isCueCard && totalQ > 1 && (
        <div className="mt-6 flex gap-3 pb-4">
          <button
            onClick={prevQuestion}
            disabled={qIdx === 0}
            className="inline-flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl border-[0.5px] border-[#E7E5E4] py-3 text-[15px] font-medium text-[#57534E] transition-all duration-200 hover:border-[#047857] hover:text-stone-800 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-[#E7E5E4] disabled:hover:text-[#57534E]"
          >
            <ChevronLeft size={18} strokeWidth={1.75} />
            Previous
          </button>
          <button
            onClick={nextQuestion}
            disabled={qIdx === totalQ - 1}
            className="inline-flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#047857] py-3 text-[15px] font-medium text-white transition-colors duration-200 hover:bg-[#0F766E] disabled:cursor-not-allowed disabled:opacity-50"
          >
            Next Question
            <ChevronRight size={18} strokeWidth={1.75} />
          </button>
        </div>
      )}
    </div>
  );
}

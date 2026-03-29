"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Mic,
  MicOff,
  Phone,
  PhoneOff,
  Volume2,
  Loader2,
} from "lucide-react";

/* ── Types ──────────────────────────────────────────────────── */

type SessionState = "idle" | "connecting" | "connected" | "ended" | "error";

interface TranscriptEntry {
  role: "user" | "examiner";
  text: string;
  id: number;
}

/* ── Constants ──────────────────────────────────────────────── */

const MODEL = "gemini-2.5-flash-native-audio-latest";
const WS_BASE = "wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContent";

const SYSTEM_INSTRUCTION = `You are an expert IELTS Speaking Examiner conducting a real speaking test. Follow these rules strictly:

1. **Language**: Speak ONLY in English. If the student speaks another language, gently redirect them.
2. **Structure**: Follow the standard IELTS Speaking test format:
   - **Part 1 (Introduction & Interview)**: Ask 4-5 general questions about familiar topics (home, work, studies, hobbies). Spend about 4 minutes.
   - **Part 2 (Long Turn)**: Give a cue card topic. Tell the student they have 1 minute to prepare, then ask them to speak for 1-2 minutes. Then ask 1-2 follow-up questions.
   - **Part 3 (Discussion)**: Ask 4-5 abstract questions related to the Part 2 topic. Probe deeper with follow-ups.
3. **Pacing**: Ask ONE question at a time. Wait for the student to finish before asking the next question.
4. **Tone**: Be professional, warm, and encouraging. Use natural examiner phrases like "That's interesting" or "Can you tell me more about that?"
5. **No Scoring**: Do NOT give scores or detailed feedback during the conversation.
6. **Timing**: After approximately 11-14 minutes of conversation, politely end the test by saying "Thank you, that is the end of the speaking test."
7. **Start**: Begin by introducing yourself: "Good morning/afternoon. My name is Emma, and I'll be your speaking examiner today. Can you tell me your full name, please?"`;

/* ── Audio Helpers ───────────────────────────────────────────── */

/** Convert Float32Array samples to 16-bit PCM Int16Array */
function float32ToInt16(float32: Float32Array): Int16Array {
  const int16 = new Int16Array(float32.length);
  for (let i = 0; i < float32.length; i++) {
    const s = Math.max(-1, Math.min(1, float32[i]));
    int16[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
  }
  return int16;
}

/** Simple linear downsampling from source rate to target rate */
function downsample(buffer: Float32Array, fromRate: number, toRate: number): Float32Array {
  if (fromRate === toRate) return buffer;
  const ratio = fromRate / toRate;
  const newLength = Math.round(buffer.length / ratio);
  const result = new Float32Array(newLength);
  for (let i = 0; i < newLength; i++) {
    result[i] = buffer[Math.round(i * ratio)];
  }
  return result;
}

/** Convert a base64-encoded PCM16 string into an AudioBuffer for playback */
function pcm16ToAudioBuffer(
  ctx: AudioContext,
  base64: string,
  sampleRate: number = 24000
): AudioBuffer {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);

  const int16 = new Int16Array(bytes.buffer);
  const float32 = new Float32Array(int16.length);
  for (let i = 0; i < int16.length; i++) {
    float32[i] = int16[i] / 0x8000;
  }

  const audioBuffer = ctx.createBuffer(1, float32.length, sampleRate);
  audioBuffer.copyToChannel(float32, 0);
  return audioBuffer;
}

/* ── Component ──────────────────────────────────────────────── */

export default function GeminiLiveExaminer() {
  const [state, setState] = useState<SessionState>("idle");
  const [isMuted, setIsMuted] = useState(false);
  const [transcript, setTranscript] = useState<TranscriptEntry[]>([]);
  const [currentUserText, setCurrentUserText] = useState("");
  const [currentAIText, setCurrentAIText] = useState("");
  const [elapsedTime, setElapsedTime] = useState(0);
  const [aiSpeaking, setAiSpeaking] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const wsRef = useRef<WebSocket | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const playbackCtxRef = useRef<AudioContext | null>(null);
  const idCounterRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const audioQueueRef = useRef<AudioBuffer[]>([]);
  const isPlayingRef = useRef(false);
  const transcriptEndRef = useRef<HTMLDivElement | null>(null);
  // Use a ref for state to avoid stale closures in WS callbacks
  const sessionStateRef = useRef<SessionState>("idle");

  // Auto-scroll transcript
  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [transcript, currentUserText, currentAIText]);

  // Elapsed timer
  useEffect(() => {
    if (state === "connected") {
      timerRef.current = setInterval(() => setElapsedTime((t) => t + 1), 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [state]);

  /* ── Audio Playback Queue ──────────────────────────────────── */

  const playNextInQueue = useCallback(() => {
    if (isPlayingRef.current || audioQueueRef.current.length === 0) return;
    isPlayingRef.current = true;
    setAiSpeaking(true);

    const ctx = playbackCtxRef.current!;
    const buffer = audioQueueRef.current.shift()!;
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(ctx.destination);
    source.onended = () => {
      isPlayingRef.current = false;
      if (audioQueueRef.current.length > 0) {
        playNextInQueue();
      } else {
        setAiSpeaking(false);
      }
    };
    source.start();
  }, []);

  const enqueueAudio = useCallback(
    (base64: string) => {
      if (!playbackCtxRef.current) {
        // Do NOT force sampleRate — let the browser use the OS native rate (e.g. 48000 on Mac M4).
        // The AudioBuffer is created at 24000 Hz (Gemini output rate) so the browser resamples cleanly.
        playbackCtxRef.current = new AudioContext();
      }
      const buffer = pcm16ToAudioBuffer(playbackCtxRef.current, base64, 24000);
      audioQueueRef.current.push(buffer);
      playNextInQueue();
    },
    [playNextInQueue]
  );

  /* ── Start Session ─────────────────────────────────────────── */

  const startSession = useCallback(async () => {
    // Check daily Gemini session limit before connecting
    try {
      const checkRes = await fetch("/api/usage/gemini");
      const checkData = await checkRes.json();
      if (!checkData.allowed) {
        setErrorMessage(checkData.message || "Daily live speaking session limit reached. Come back tomorrow.");
        setState("error");
        sessionStateRef.current = "error";
        return;
      }
    } catch {
      // If check fails, allow the session (don't block on usage check failure)
    }

    setState("connecting");
    sessionStateRef.current = "connecting";
    setTranscript([]);
    setElapsedTime(0);
    setCurrentUserText("");
    setCurrentAIText("");
    audioQueueRef.current = [];

    const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    if (!apiKey) {
      console.error("NEXT_PUBLIC_GEMINI_API_KEY is not set");
      setState("idle");
      return;
    }

    try {
      // 1. Get mic access — use minimal constraints to maximise device compatibility
      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            channelCount: 1,
          },
        });
      } catch (micErr: unknown) {
        const name = (micErr as DOMException)?.name ?? "";
        let msg = "Could not access your microphone. Please check your system settings.";
        if (name === "NotFoundError" || name === "DevicesNotFoundError") {
          msg = "No microphone found. Please plug in a mic or enable it in System Settings → Privacy & Security → Microphone.";
        } else if (name === "NotAllowedError" || name === "PermissionDeniedError") {
          msg = "Microphone access was blocked. Please allow microphone access in your browser's site settings.";
        } else if (name === "NotReadableError") {
          msg = "Your microphone is being used by another app. Please close other apps that may be using it and try again.";
        }
        setErrorMessage(msg);
        setState("error");
        return;
      }
      streamRef.current = stream;

      // 2. Open WebSocket
      const ws = new WebSocket(`${WS_BASE}?key=${apiKey}`);
      wsRef.current = ws;

      ws.onopen = () => {
        // Send setup/config message
        const configMessage = {
          setup: {
            model: `models/${MODEL}`,
            generationConfig: {
              responseModalities: ["AUDIO"],
              speechConfig: {
                voiceConfig: {
                  prebuiltVoiceConfig: {
                    voiceName: "Aoede",
                  },
                },
              },
            },
            systemInstruction: {
              parts: [{ text: SYSTEM_INSTRUCTION }],
            },
          },
        };
        ws.send(JSON.stringify(configMessage));
      };

      ws.onmessage = (event) => {
        // Gemini Live API may send messages as Blob (binary) or string
        const processMessage = (text: string) => {
          let data: Record<string, unknown>;
          try {
            data = JSON.parse(text);
          } catch {
            return; // Ignore non-JSON frames
          }

          // Setup complete
          if (data.setupComplete) {
            setState("connected");
            sessionStateRef.current = "connected";
            // Record Gemini session usage
            fetch("/api/usage/gemini", { method: "POST" }).catch(() => {});
            startAudioCapture(stream);
            return;
          }

          // Server content
          if (data.serverContent) {
            const sc = data.serverContent as Record<string, unknown>;
            const modelTurn = sc.modelTurn as { parts?: { inlineData?: { data?: string } }[] } | undefined;
            const inputTranscription = sc.inputTranscription as { text?: string } | undefined;
            const outputTranscription = sc.outputTranscription as { text?: string } | undefined;

            // Audio response
            if (modelTurn?.parts) {
              for (const part of modelTurn.parts) {
                if (part.inlineData?.data) {
                  enqueueAudio(part.inlineData.data);
                }
              }
            }

            // Input transcription (student's speech as text)
            if (inputTranscription?.text) {
              setCurrentUserText((prev) => prev + inputTranscription.text);
            }

            // Output transcription (AI's speech as text)
            if (outputTranscription?.text) {
              setCurrentAIText((prev) => prev + outputTranscription.text);
            }

            // Turn complete — flush current texts to transcript
            if (sc.turnComplete) {
              flushTranscripts();
            }
          }
        };

        if (event.data instanceof Blob) {
          const reader = new FileReader();
          reader.onload = () => processMessage(reader.result as string);
          reader.readAsText(event.data);
        } else {
          processMessage(event.data as string);
        }
      };

      ws.onerror = (e) => {
        console.error("WebSocket error:", e);
        setErrorMessage("Connection to Gemini failed. Please check your API key and try again.");
        setState("error");
        sessionStateRef.current = "error";
      };

      ws.onclose = (e) => {
        console.log(`WebSocket closed: code=${e.code} reason="${e.reason}"`);
        // Only move to ended if we were actually connected (not if an error already handled it)
        if (sessionStateRef.current === "connected") {
          setState("ended");
          sessionStateRef.current = "ended";
        } else if (sessionStateRef.current === "connecting") {
          // Closed before we even connected — show the reason
          const reason = e.reason || `Connection refused (code ${e.code})`;
          setErrorMessage(`Could not connect to AI examiner: ${reason}`);
          setState("error");
          sessionStateRef.current = "error";
        }
      };
    } catch (err) {
      console.error("Failed to start session:", err);
      setErrorMessage("An unexpected error occurred. Please try again.");
      setState("error");
    }
  }, [enqueueAudio, state]);

  /* ── Flush accumulated text to transcript entries ──────────── */

  const flushTranscripts = useCallback(() => {
    setCurrentUserText((prevUser) => {
      if (prevUser.trim()) {
        setTranscript((t) => [
          ...t,
          { role: "user", text: prevUser.trim(), id: idCounterRef.current++ },
        ]);
      }
      return "";
    });

    setCurrentAIText((prevAI) => {
      if (prevAI.trim()) {
        setTranscript((t) => [
          ...t,
          { role: "examiner", text: prevAI.trim(), id: idCounterRef.current++ },
        ]);
      }
      return "";
    });
  }, []);

  /* ── Audio Capture ─────────────────────────────────────────── */

  const startAudioCapture = useCallback(
    (stream: MediaStream) => {
      const ctx = new AudioContext();
      audioCtxRef.current = ctx;
      const source = ctx.createMediaStreamSource(stream);

      // ScriptProcessor for broad compatibility (AudioWorklet preferred in prod)
      const processor = ctx.createScriptProcessor(4096, 1, 1);
      processorRef.current = processor;

      processor.onaudioprocess = (e) => {
        if (isMuted) return;
        const ws = wsRef.current;
        if (!ws || ws.readyState !== WebSocket.OPEN) return;

        const inputData = e.inputBuffer.getChannelData(0);
        const downsampled = downsample(inputData, ctx.sampleRate, 16000);
        const pcm16 = float32ToInt16(downsampled);

        // Convert to base64
        const uint8 = new Uint8Array(pcm16.buffer);
        let binary = "";
        for (let i = 0; i < uint8.length; i++) {
          binary += String.fromCharCode(uint8[i]);
        }
        const base64 = btoa(binary);

        const msg = {
          realtimeInput: {
            mediaChunks: [
              {
                mimeType: "audio/pcm;rate=16000",
                data: base64,
              },
            ],
          },
        };
        ws.send(JSON.stringify(msg));
      };

      source.connect(processor);
      processor.connect(ctx.destination);
    },
    [isMuted]
  );

  /* ── End Session ───────────────────────────────────────────── */

  const endSession = useCallback(() => {
    // Close WebSocket
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    // Stop mic
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }

    // Disconnect audio processor
    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current = null;
    }
    if (audioCtxRef.current) {
      audioCtxRef.current.close();
      audioCtxRef.current = null;
    }

    // Clear timer
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    // Flush remaining text
    flushTranscripts();
    setState("ended");
  }, [flushTranscripts]);

  /* ── Toggle Mute ───────────────────────────────────────────── */

  const toggleMute = useCallback(() => {
    setIsMuted((m) => {
      const newMuted = !m;
      if (streamRef.current) {
        streamRef.current.getAudioTracks().forEach((t) => {
          t.enabled = !newMuted;
        });
      }
      return newMuted;
    });
  }, []);

  /* ── Format Time ───────────────────────────────────────────── */

  function formatTime(s: number) {
    const m = Math.floor(s / 60)
      .toString()
      .padStart(2, "0");
    const sec = (s % 60).toString().padStart(2, "0");
    return `${m}:${sec}`;
  }

  /* ── Render ────────────────────────────────────────────────── */

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="animate-fade-up flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/speaking"
            className="flex h-10 w-10 items-center justify-center rounded-full border-[0.5px] border-[#2A3150] bg-[#1E2540] transition-all duration-200 hover:border-[rgba(99,102,241,0.3)]"
          >
            <ArrowLeft size={20} strokeWidth={1.75} className="text-[#94A3B8]" />
          </Link>
          <div>
            <h1 className="text-base font-medium text-[#F8FAFC]">
              Live AI Speaking Practice
            </h1>
            <p className="text-xs text-[#64748B]">
              Powered by Gemini 3.1 Flash
            </p>
          </div>
        </div>
        {state === "connected" && (
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 animate-pulse rounded-full bg-[#22C55E]" />
            <span className="font-mono text-sm text-[#94A3B8]">
              {formatTime(elapsedTime)}
            </span>
          </div>
        )}
      </div>

      {/* ── Error State ───────────────────────────────────────── */}
      {state === "error" && (
        <div className="mt-10 flex flex-1 flex-col items-center justify-center gap-5 text-center">
          <div className="flex h-24 w-24 items-center justify-center rounded-full border-2 border-[#EF4444] bg-[rgba(239,68,68,0.1)]">
            <MicOff size={38} strokeWidth={1.5} className="text-[#EF4444]" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-[#F8FAFC]">
              Microphone Error
            </h2>
            <p className="mt-2 max-w-sm text-sm text-[#94A3B8]">
              {errorMessage}
            </p>
          </div>
          <button
            onClick={() => { setState("idle"); setErrorMessage(""); }}
            className="flex items-center gap-2 rounded-xl border-[0.5px] border-[#2A3150] px-6 py-3 text-sm font-medium text-[#94A3B8] transition-all hover:border-[#6366F1] hover:text-white"
          >
            Try Again
          </button>
        </div>
      )}

      {/* ── Idle State ────────────────────────────────────────── */}
      {state === "idle" && (
        <div className="mt-10 flex flex-1 flex-col items-center justify-center gap-6">
          <div className="flex h-28 w-28 items-center justify-center rounded-full bg-gradient-to-br from-[#6366F1] to-[#4F46E5] shadow-[0_0_60px_rgba(99,102,241,0.3)]">
            <Mic size={48} strokeWidth={1.5} className="text-white" />
          </div>
          <div className="text-center">
            <h2 className="text-xl font-semibold text-[#F8FAFC]">
              Ready to Practice?
            </h2>
            <p className="mt-2 max-w-sm text-sm text-[#94A3B8]">
              Start a live conversation with your AI IELTS examiner. The test
              will cover all three parts of the Speaking exam.
            </p>
          </div>
          <button
            onClick={startSession}
            className="mt-2 flex items-center gap-2.5 rounded-xl bg-gradient-to-r from-[#6366F1] to-[#4F46E5] px-8 py-3.5 text-[15px] font-medium text-white shadow-lg shadow-[rgba(99,102,241,0.25)] transition-all duration-200 hover:scale-[1.02] hover:shadow-[rgba(99,102,241,0.4)]"
          >
            <Phone size={18} strokeWidth={1.75} />
            Start Practice
          </button>
        </div>
      )}

      {/* ── Connecting State ──────────────────────────────────── */}
      {state === "connecting" && (
        <div className="mt-10 flex flex-1 flex-col items-center justify-center gap-4">
          <div className="flex h-28 w-28 items-center justify-center rounded-full border-2 border-[#6366F1] bg-[#1E2540]">
            <Loader2
              size={40}
              strokeWidth={1.5}
              className="animate-spin text-[#6366F1]"
            />
          </div>
          <p className="text-sm text-[#94A3B8]">
            Connecting to examiner...
          </p>
        </div>
      )}

      {/* ── Connected State ───────────────────────────────────── */}
      {state === "connected" && (
        <>
          {/* Transcript area */}
          <div className="mt-6 flex-1 overflow-y-auto rounded-xl border-[0.5px] border-[#2A3150] bg-[#12172B] p-4 space-y-3" style={{ maxHeight: "55vh" }}>
            {transcript.length === 0 && !currentUserText && !currentAIText && (
              <p className="text-center text-sm italic text-[#64748B]">
                The examiner will begin shortly...
              </p>
            )}

            {transcript.map((entry) => (
              <div
                key={entry.id}
                className={`flex ${
                  entry.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-[80%] rounded-xl px-4 py-2.5 text-sm ${
                    entry.role === "user"
                      ? "bg-[#6366F1] text-white"
                      : "border-[0.5px] border-[#2A3150] bg-[#1E2540] text-[#E2E8F0]"
                  }`}
                >
                  <p className="text-[10px] font-medium uppercase tracking-wider opacity-60 mb-1">
                    {entry.role === "user" ? "You" : "Examiner"}
                  </p>
                  {entry.text}
                </div>
              </div>
            ))}

            {/* Live in-progress text */}
            {currentAIText && (
              <div className="flex justify-start">
                <div className="max-w-[80%] rounded-xl border-[0.5px] border-[rgba(99,102,241,0.3)] bg-[#1E2540] px-4 py-2.5 text-sm text-[#E2E8F0]">
                  <p className="text-[10px] font-medium uppercase tracking-wider text-[#6366F1] mb-1">
                    Examiner
                  </p>
                  {currentAIText}
                  <span className="inline-block w-1.5 h-4 bg-[#6366F1] animate-pulse ml-0.5 rounded-sm" />
                </div>
              </div>
            )}

            {currentUserText && (
              <div className="flex justify-end">
                <div className="max-w-[80%] rounded-xl bg-[rgba(99,102,241,0.3)] px-4 py-2.5 text-sm text-white">
                  <p className="text-[10px] font-medium uppercase tracking-wider opacity-60 mb-1">
                    You
                  </p>
                  {currentUserText}
                  <span className="inline-block w-1.5 h-4 bg-white animate-pulse ml-0.5 rounded-sm" />
                </div>
              </div>
            )}

            <div ref={transcriptEndRef} />
          </div>

          {/* AI speaking indicator */}
          {aiSpeaking && (
            <div className="mt-3 flex items-center justify-center gap-2">
              <Volume2 size={16} className="text-[#6366F1] animate-pulse" />
              <span className="text-xs text-[#94A3B8]">
                Examiner is speaking...
              </span>
            </div>
          )}

          {/* Controls */}
          <div className="mt-4 flex items-center justify-center gap-4 pb-4">
            <button
              onClick={toggleMute}
              className={`flex h-14 w-14 items-center justify-center rounded-full transition-all duration-200 ${
                isMuted
                  ? "bg-[#EF4444] text-white shadow-lg shadow-[rgba(239,68,68,0.3)]"
                  : "border-[0.5px] border-[#2A3150] bg-[#1E2540] text-[#94A3B8] hover:border-[#6366F1] hover:text-white"
              }`}
              title={isMuted ? "Unmute" : "Mute"}
            >
              {isMuted ? (
                <MicOff size={22} strokeWidth={1.75} />
              ) : (
                <Mic size={22} strokeWidth={1.75} />
              )}
            </button>

            <button
              onClick={endSession}
              className="flex h-14 w-14 items-center justify-center rounded-full bg-[#EF4444] text-white shadow-lg shadow-[rgba(239,68,68,0.3)] transition-all duration-200 hover:scale-105"
              title="End Session"
            >
              <PhoneOff size={22} strokeWidth={1.75} />
            </button>
          </div>
        </>
      )}

      {/* ── Ended State ───────────────────────────────────────── */}
      {state === "ended" && (
        <div className="mt-6 flex flex-col gap-6">
          {/* Summary */}
          <div className="rounded-xl border-[0.5px] border-[#2A3150] bg-[#1E2540] p-5 text-center">
            <h2 className="text-lg font-semibold text-[#F8FAFC]">
              Practice Session Complete
            </h2>
            <p className="mt-1 text-sm text-[#94A3B8]">
              Duration: {formatTime(elapsedTime)}
            </p>
          </div>

          {/* Full Transcript */}
          {transcript.length > 0 && (
            <div className="rounded-xl border-[0.5px] border-[#2A3150] bg-[#12172B] p-4 space-y-3" style={{ maxHeight: "50vh", overflowY: "auto" }}>
              <p className="text-xs font-medium uppercase tracking-wider text-[#64748B] mb-2">
                Full Transcript
              </p>
              {transcript.map((entry) => (
                <div key={entry.id} className="text-sm">
                  <span
                    className={`font-medium ${
                      entry.role === "user"
                        ? "text-[#6366F1]"
                        : "text-[#22C55E]"
                    }`}
                  >
                    {entry.role === "user" ? "You" : "Examiner"}:
                  </span>{" "}
                  <span className="text-[#E2E8F0]">{entry.text}</span>
                </div>
              ))}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pb-4">
            <button
              onClick={() => {
                setState("idle");
                setTranscript([]);
                setElapsedTime(0);
              }}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#6366F1] to-[#4F46E5] py-3.5 text-[15px] font-medium text-white transition-all hover:scale-[1.01]"
            >
              <Phone size={18} strokeWidth={1.75} />
              Practice Again
            </button>
            <Link
              href="/dashboard/speaking"
              className="flex flex-1 items-center justify-center gap-2 rounded-xl border-[0.5px] border-[#2A3150] py-3.5 text-[15px] font-medium text-[#94A3B8] transition-all hover:border-[#6366F1] hover:text-white"
            >
              Back to Speaking
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

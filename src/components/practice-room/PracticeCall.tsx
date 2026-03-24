"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  Clock,
  User,
  ChevronRight,
  Mic,
  MicOff,
  PhoneOff,
  SkipForward,
  AlertCircle,
} from "lucide-react";
import { useSocket } from "@/hooks/useSocket";
import { useWebRTC } from "@/hooks/useWebRTC";
import AudioBars from "./AudioBars";

const topics = [
  "Describe a place in your country that you would like to recommend to visitors. You should say: where it is, what people can see and do there, and explain why you would recommend this place.",
  "Talk about a skill you learned that you found useful. You should say: what the skill is, how you learned it, and explain why it has been useful.",
  "Describe a time when you helped someone. You should say: who you helped, how you helped them, and explain how you felt about it.",
  "Talk about a book or movie that made a strong impression on you. You should say: what it was about, when you read or watched it, and explain why it impressed you.",
  "Describe a goal you have set for yourself recently. You should say: what the goal is, why you set it, and explain what you are doing to achieve it.",
];

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60).toString().padStart(2, "0");
  const s = (seconds % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

export default function PracticeCall() {
  const searchParams = useSearchParams();
  const roomId = searchParams.get("roomId");
  const isInitiator = searchParams.get("initiator") === "true";
  const router = useRouter();

  const socketRef = useSocket();
  const {
    localStream,
    remoteStream,
    isMuted,
    micError,
    toggleMute,
    endCall,
  } = useWebRTC({
    socket: socketRef.current,
    roomId,
    isInitiator,
  });

  const [topicIdx, setTopicIdx] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [partnerLeft, setPartnerLeft] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const remoteAudioRef = useRef<HTMLAudioElement | null>(null);

  // Start timer
  useEffect(() => {
    timerRef.current = setInterval(() => {
      setElapsed((prev) => prev + 1);
    }, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  // Play remote audio
  useEffect(() => {
    if (remoteStream && remoteAudioRef.current) {
      remoteAudioRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  // Handle partner leaving
  useEffect(() => {
    const socket = socketRef.current;
    if (!socket) return;

    function onPartnerLeft() {
      setPartnerLeft(true);
      if (timerRef.current) clearInterval(timerRef.current);
      setTimeout(() => {
        router.push("/dashboard/practice-room");
      }, 3000);
    }

    socket.on("partner-left", onPartnerLeft);
    return () => {
      socket.off("partner-left", onPartnerLeft);
    };
  }, [socketRef, router]);

  const handleEndCall = useCallback(() => {
    endCall();
    if (timerRef.current) clearInterval(timerRef.current);
    router.push("/dashboard/practice-room");
  }, [endCall, router]);

  const handleNextTopic = useCallback(() => {
    setTopicIdx((prev) => (prev + 1) % topics.length);
  }, []);

  // Microphone error state
  if (micError) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center gap-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[rgba(185,28,28,0.15)]">
          <AlertCircle size={32} strokeWidth={1.75} className="text-[#B91C1C]" />
        </div>
        <p className="max-w-sm text-center text-[15px] text-[#292524]">{micError}</p>
        <button
          onClick={() => router.push("/dashboard/practice-room")}
          className="mt-2 rounded-xl bg-[#047857] px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-[#0F766E]"
        >
          Back to Lobby
        </button>
      </div>
    );
  }

  // Partner left overlay
  if (partnerLeft) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center gap-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[rgba(180,83,9,0.15)]">
          <User size={32} strokeWidth={1.75} className="text-[#B45309]" />
        </div>
        <p className="text-[15px] font-medium text-[#292524]">Your partner has left</p>
        <p className="text-[13px] text-[#78716C]">Redirecting to lobby...</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-[calc(100dvh-120px)] flex-col md:min-h-0">
      {/* Hidden audio element for remote playback */}
      <audio ref={remoteAudioRef} autoPlay playsInline />

      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={handleEndCall}
          className="flex h-10 w-10 items-center justify-center rounded-full border-[0.5px] border-[#E7E5E4] bg-[#FDF8F2] transition-all duration-200 hover:border-[rgba(4,120,87,0.28)]"
        >
          <ArrowLeft size={20} strokeWidth={1.75} className="text-[#57534E]" />
        </button>
        <h1 className="text-base font-medium text-[#292524]">Practice Session</h1>
        <span className="flex items-center gap-1.5 text-sm text-[#78716C]">
          <Clock size={16} strokeWidth={1.75} />
          {formatTime(elapsed)}
        </span>
      </div>

      {/* User avatars */}
      <div className="mt-8 flex items-center justify-center gap-8">
        <div className="flex flex-col items-center gap-2">
          <div className="flex h-12 w-12 items-center justify-center rounded-full border-[0.5px] border-[#E7E5E4] bg-[#FDF8F2]">
            <User size={20} strokeWidth={1.75} className="text-[#0F766E]" />
          </div>
          <span className="text-xs text-[#78716C]">You</span>
        </div>
        <div className="h-px w-8 bg-[#E7E5E4]" />
        <div className="flex flex-col items-center gap-2">
          <div className="flex h-12 w-12 items-center justify-center rounded-full border-[0.5px] border-[#E7E5E4] bg-[#FDF8F2]">
            <User size={20} strokeWidth={1.75} className="text-[#B45309]" />
          </div>
          <span className="text-xs text-[#78716C]">Partner</span>
        </div>
      </div>

      {/* Topic card */}
      <div
        key={topicIdx}
        className="animate-step-enter mt-6 rounded-xl border-[0.5px] border-[#E7E5E4] bg-[#FDF8F2] p-5"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <span className="text-xs uppercase tracking-wider text-[#78716C]">
              Current Topic
            </span>
            <p className="mt-2 text-base text-[#292524]">{topics[topicIdx]}</p>
            <div className="mt-3 flex items-center gap-2">
              <span className="text-[13px] text-[#78716C]">
                Topic {topicIdx + 1} of {topics.length}
              </span>
              <div className="flex gap-1.5">
                {topics.map((_, i) => (
                  <span
                    key={i}
                    className={`rounded-full ${
                      i === topicIdx
                        ? "h-2 w-2 bg-[#047857]"
                        : "h-1.5 w-1.5 bg-[#E7E5E4]"
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
          <button
            onClick={handleNextTopic}
            className="mt-6 flex flex-shrink-0 cursor-pointer items-center gap-1 rounded-lg border-[0.5px] border-[#E7E5E4] px-3 py-1.5 text-xs text-[#57534E] transition-all duration-200 hover:border-[#047857] hover:text-stone-800"
          >
            Next
            <ChevronRight size={12} strokeWidth={1.75} />
          </button>
        </div>
      </div>

      {/* Audio visualizations */}
      <div className="mt-8 flex items-end justify-center gap-12">
        <AudioBars color="#0F766E" label="You" stream={localStream} />
        <AudioBars color="#B45309" label="Partner" stream={remoteStream} />
      </div>

      {/* Controls */}
      <div className="mt-auto flex items-center justify-center gap-5 pt-10 pb-4">
        <button
          onClick={toggleMute}
          className={`flex h-14 w-14 cursor-pointer items-center justify-center rounded-full border-[0.5px] transition-all duration-200 ${
            isMuted
              ? "border-[#B91C1C] bg-[rgba(185,28,28,0.15)]"
              : "border-[#E7E5E4] bg-[#FDF8F2] hover:border-[rgba(4,120,87,0.28)]"
          }`}
          aria-label={isMuted ? "Unmute" : "Mute"}
        >
          {isMuted ? (
            <MicOff size={22} strokeWidth={1.75} className="text-[#B91C1C]" />
          ) : (
            <Mic size={22} strokeWidth={1.75} className="text-[#292524]" />
          )}
        </button>

        <button
          onClick={handleEndCall}
          className="flex h-16 w-16 cursor-pointer items-center justify-center rounded-full bg-[#B91C1C] transition-colors duration-200 hover:bg-[#DC2626]"
          aria-label="End call"
        >
          <PhoneOff size={24} strokeWidth={1.75} className="text-white" />
        </button>

        <button
          onClick={handleNextTopic}
          className="flex h-14 w-14 cursor-pointer items-center justify-center rounded-full border-[0.5px] border-[#E7E5E4] bg-[#FDF8F2] transition-all duration-200 hover:border-[rgba(4,120,87,0.28)]"
          aria-label="Skip topic"
        >
          <SkipForward size={22} strokeWidth={1.75} className="text-[#292524]" />
        </button>
      </div>
    </div>
  );
}

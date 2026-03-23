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
import { useSocketContext } from "@/contexts/SocketContext";
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

  const { socket } = useSocketContext();
  const {
    localStream,
    remoteStream,
    isMuted,
    micError,
    toggleMute,
    endCall,
  } = useWebRTC({
    socket,
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
  }, [socket, router]);

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
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[rgba(239,68,68,0.15)]">
          <AlertCircle size={32} strokeWidth={1.75} className="text-[#EF4444]" />
        </div>
        <p className="max-w-sm text-center text-[15px] text-[#F8FAFC]">{micError}</p>
        <button
          onClick={() => router.push("/dashboard/practice-room")}
          className="mt-2 rounded-xl bg-[#6366F1] px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-[#818CF8]"
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
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[rgba(245,158,11,0.15)]">
          <User size={32} strokeWidth={1.75} className="text-[#F59E0B]" />
        </div>
        <p className="text-[15px] font-medium text-[#F8FAFC]">Your partner has left</p>
        <p className="text-[13px] text-[#64748B]">Redirecting to lobby...</p>
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
          className="flex h-10 w-10 items-center justify-center rounded-full border-[0.5px] border-[#2A3150] bg-[#1E2540] transition-all duration-200 hover:border-[rgba(99,102,241,0.3)]"
        >
          <ArrowLeft size={20} strokeWidth={1.75} className="text-[#94A3B8]" />
        </button>
        <h1 className="text-base font-medium text-[#F8FAFC]">Practice Session</h1>
        <span className="flex items-center gap-1.5 text-sm text-[#64748B]">
          <Clock size={16} strokeWidth={1.75} />
          {formatTime(elapsed)}
        </span>
      </div>

      {/* User avatars */}
      <div className="mt-8 flex items-center justify-center gap-8">
        <div className="flex flex-col items-center gap-2">
          <div className="flex h-12 w-12 items-center justify-center rounded-full border-[0.5px] border-[#2A3150] bg-[#1E2540]">
            <User size={20} strokeWidth={1.75} className="text-[#0EA5E9]" />
          </div>
          <span className="text-xs text-[#64748B]">You</span>
        </div>
        <div className="h-px w-8 bg-[#2A3150]" />
        <div className="flex flex-col items-center gap-2">
          <div className="flex h-12 w-12 items-center justify-center rounded-full border-[0.5px] border-[#2A3150] bg-[#1E2540]">
            <User size={20} strokeWidth={1.75} className="text-[#A855F7]" />
          </div>
          <span className="text-xs text-[#64748B]">Partner</span>
        </div>
      </div>

      {/* Topic card */}
      <div
        key={topicIdx}
        className="animate-step-enter mt-6 rounded-xl border-[0.5px] border-[#2A3150] bg-[#1E2540] p-5"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <span className="text-xs uppercase tracking-wider text-[#64748B]">
              Current Topic
            </span>
            <p className="mt-2 text-base text-[#F8FAFC]">{topics[topicIdx]}</p>
            <div className="mt-3 flex items-center gap-2">
              <span className="text-[13px] text-[#64748B]">
                Topic {topicIdx + 1} of {topics.length}
              </span>
              <div className="flex gap-1.5">
                {topics.map((_, i) => (
                  <span
                    key={i}
                    className={`rounded-full ${
                      i === topicIdx
                        ? "h-2 w-2 bg-[#6366F1]"
                        : "h-1.5 w-1.5 bg-[#2A3150]"
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
          <button
            onClick={handleNextTopic}
            className="mt-6 flex flex-shrink-0 cursor-pointer items-center gap-1 rounded-lg border-[0.5px] border-[#2A3150] px-3 py-1.5 text-xs text-[#94A3B8] transition-all duration-200 hover:border-[#6366F1] hover:text-white"
          >
            Next
            <ChevronRight size={12} strokeWidth={1.75} />
          </button>
        </div>
      </div>

      {/* Audio visualizations */}
      <div className="mt-8 flex items-end justify-center gap-12">
        <AudioBars color="#0EA5E9" label="You" stream={localStream} />
        <AudioBars color="#A855F7" label="Partner" stream={remoteStream} />
      </div>

      {/* Controls */}
      <div className="mt-auto flex items-center justify-center gap-5 pt-10 pb-4">
        <button
          onClick={toggleMute}
          className={`flex h-14 w-14 cursor-pointer items-center justify-center rounded-full border-[0.5px] transition-all duration-200 ${
            isMuted
              ? "border-[#EF4444] bg-[rgba(239,68,68,0.15)]"
              : "border-[#2A3150] bg-[#1E2540] hover:border-[rgba(99,102,241,0.3)]"
          }`}
          aria-label={isMuted ? "Unmute" : "Mute"}
        >
          {isMuted ? (
            <MicOff size={22} strokeWidth={1.75} className="text-[#EF4444]" />
          ) : (
            <Mic size={22} strokeWidth={1.75} className="text-[#F8FAFC]" />
          )}
        </button>

        <button
          onClick={handleEndCall}
          className="flex h-16 w-16 cursor-pointer items-center justify-center rounded-full bg-[#EF4444] transition-colors duration-200 hover:bg-[#DC2626]"
          aria-label="End call"
        >
          <PhoneOff size={24} strokeWidth={1.75} className="text-white" />
        </button>

        <button
          onClick={handleNextTopic}
          className="flex h-14 w-14 cursor-pointer items-center justify-center rounded-full border-[0.5px] border-[#2A3150] bg-[#1E2540] transition-all duration-200 hover:border-[rgba(99,102,241,0.3)]"
          aria-label="Skip topic"
        >
          <SkipForward size={22} strokeWidth={1.75} className="text-[#F8FAFC]" />
        </button>
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Clock,
  User,
  ChevronRight,
  Mic,
  MicOff,
  PhoneOff,
  SkipForward,
} from "lucide-react";
import AudioBars from "./AudioBars";

const topics = [
  "Describe a place in your country that you would like to recommend to visitors. You should say: where it is, what people can see and do there, and explain why you would recommend this place.",
  "Talk about a skill you learned that you found useful. You should say: what the skill is, how you learned it, and explain why it has been useful.",
  "Describe a time when you helped someone. You should say: who you helped, how you helped them, and explain how you felt about it.",
];

export default function PracticeCall() {
  const [muted, setMuted] = useState(false);
  const [topicIdx, setTopicIdx] = useState(0);

  return (
    <div className="flex min-h-[calc(100dvh-120px)] flex-col md:min-h-0">
      <div className="flex items-center justify-between">
        <Link
          href="/dashboard/practice-room"
          className="flex h-10 w-10 items-center justify-center rounded-full border-[0.5px] border-[#2A3150] bg-[#1E2540] transition-all duration-200 hover:border-[rgba(99,102,241,0.3)]"
        >
          <ArrowLeft size={20} strokeWidth={1.75} className="text-[#94A3B8]" />
        </Link>
        <h1 className="text-base font-medium text-[#F8FAFC]">Practice Session</h1>
        <span className="flex items-center gap-1.5 text-sm text-[#64748B]">
          <Clock size={16} strokeWidth={1.75} />
          05:23
        </span>
      </div>

      <div className="mt-8 flex items-center justify-center gap-8">
        <div className="flex flex-col items-center gap-2">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#1E2540] border-[0.5px] border-[#2A3150]">
            <User size={20} strokeWidth={1.75} className="text-[#0EA5E9]" />
          </div>
          <span className="text-xs text-[#64748B]">You</span>
        </div>
        <div className="h-px w-8 bg-[#2A3150]" />
        <div className="flex flex-col items-center gap-2">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#1E2540] border-[0.5px] border-[#2A3150]">
            <User size={20} strokeWidth={1.75} className="text-[#A855F7]" />
          </div>
          <span className="text-xs text-[#64748B]">Partner</span>
        </div>
      </div>

      <div key={topicIdx} className="animate-step-enter mt-6 rounded-xl border-[0.5px] border-[#2A3150] bg-[#1E2540] p-5">
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
                      i === topicIdx ? "h-2 w-2 bg-[#6366F1]" : "h-1.5 w-1.5 bg-[#2A3150]"
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
          <button
            onClick={() => setTopicIdx((topicIdx + 1) % topics.length)}
            className="mt-6 flex flex-shrink-0 cursor-pointer items-center gap-1 rounded-lg border-[0.5px] border-[#2A3150] px-3 py-1.5 text-xs text-[#94A3B8] transition-all duration-200 hover:border-[#6366F1] hover:text-white"
          >
            Next
            <ChevronRight size={12} strokeWidth={1.75} />
          </button>
        </div>
      </div>

      <div className="mt-8 flex items-end justify-center gap-12">
        <AudioBars color="#0EA5E9" label="You" />
        <AudioBars color="#A855F7" label="Partner" />
      </div>

      <div className="mt-auto flex items-center justify-center gap-5 pt-10 pb-4">
        <button
          onClick={() => setMuted(!muted)}
          className={`flex h-14 w-14 cursor-pointer items-center justify-center rounded-full border-[0.5px] transition-all duration-200 ${
            muted
              ? "border-[#EF4444] bg-[rgba(239,68,68,0.15)]"
              : "border-[#2A3150] bg-[#1E2540] hover:border-[rgba(99,102,241,0.3)]"
          }`}
          aria-label={muted ? "Unmute" : "Mute"}
        >
          {muted ? (
            <MicOff size={22} strokeWidth={1.75} className="text-[#EF4444]" />
          ) : (
            <Mic size={22} strokeWidth={1.75} className="text-[#F8FAFC]" />
          )}
        </button>

        <Link
          href="/dashboard/practice-room"
          className="flex h-16 w-16 items-center justify-center rounded-full bg-[#EF4444] transition-colors duration-200 hover:bg-[#DC2626]"
          aria-label="End call"
        >
          <PhoneOff size={24} strokeWidth={1.75} className="text-white" />
        </Link>

        <button
          onClick={() => setTopicIdx((topicIdx + 1) % topics.length)}
          className="flex h-14 w-14 cursor-pointer items-center justify-center rounded-full border-[0.5px] border-[#2A3150] bg-[#1E2540] transition-all duration-200 hover:border-[rgba(99,102,241,0.3)]"
          aria-label="Skip topic"
        >
          <SkipForward size={22} strokeWidth={1.75} className="text-[#F8FAFC]" />
        </button>
      </div>
    </div>
  );
}

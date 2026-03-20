"use client";

import { useState, useEffect } from "react";
import { MessageSquare } from "lucide-react";

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good Morning";
  if (hour < 17) return "Good Afternoon";
  return "Good Evening";
}

export default function GreetingHeader() {
  const [greeting, setGreeting] = useState("Good Evening");

  useEffect(() => {
    setGreeting(getGreeting());
  }, []);

  return (
    <div className="animate-fade-up flex items-center justify-between">
      <div>
        <h1 className="font-heading text-[28px] font-bold text-[#F8FAFC]">
          {greeting}
        </h1>
        <p className="mt-1 text-sm text-[#94A3B8]">
          Let&apos;s reach your goal today!
        </p>
      </div>
      <button
        className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-lg border-[0.5px] border-[#2A3150] bg-[#1E2540] transition-all duration-200 ease-out hover:border-[rgba(99,102,241,0.3)] hover:bg-[#252B45]"
        aria-label="Messages"
      >
        <MessageSquare size={20} strokeWidth={1.75} className="text-[#94A3B8]" />
      </button>
    </div>
  );
}

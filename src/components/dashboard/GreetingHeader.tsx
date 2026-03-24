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
        <h1 className="font-heading text-[28px] font-bold text-[#292524]">
          {greeting}
        </h1>
        <p className="mt-1 text-sm text-[#57534E]">
          Let&apos;s reach your goal today!
        </p>
      </div>
      <button
        className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-lg border-[0.5px] border-[#E7E5E4] bg-[#FDF8F2] transition-all duration-200 ease-out hover:border-[rgba(4,120,87,0.28)] hover:bg-stone-100"
        aria-label="Messages"
      >
        <MessageSquare size={20} strokeWidth={1.75} className="text-[#57534E]" />
      </button>
    </div>
  );
}

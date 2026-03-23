"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Users, Search, X, Loader, MessageSquare } from "lucide-react";
import { useSocketContext } from "@/contexts/SocketContext";

type LobbyState = "idle" | "searching" | "matched";

const steps = [
  { num: "01", title: "Get matched", desc: "We pair you with another student at a similar level" },
  { num: "02", title: "Practice together", desc: "Discuss an IELTS topic for 5-10 minutes via audio" },
  { num: "03", title: "Rate & improve", desc: "Give each other feedback and track your progress" },
];

export default function PracticeRoomLobby() {
  const [state, setState] = useState<LobbyState>("idle");
  const [onlineCount, setOnlineCount] = useState(0);
  const { socket } = useSocketContext();
  const router = useRouter();

  useEffect(() => {
    if (!socket) return;

    function onOnlineCount(count: number) {
      setOnlineCount(count);
    }

    function onWaiting() {
      setState("searching");
    }

    function onMatched({ roomId, isInitiator }: { roomId: string; isInitiator: boolean }) {
      setState("matched");
      router.push(
        `/dashboard/practice-room/call?roomId=${encodeURIComponent(roomId)}&initiator=${isInitiator}`
      );
    }

    socket.on("online-count", onOnlineCount);
    socket.on("waiting", onWaiting);
    socket.on("matched", onMatched);

    return () => {
      socket.off("online-count", onOnlineCount);
      socket.off("waiting", onWaiting);
      socket.off("matched", onMatched);
    };
  }, [socket, router]);

  function handleFindPartner() {
    if (!socket) return;
    setState("searching");
    socket.emit("find-partner", {});
  }

  function handleCancel() {
    if (!socket) return;
    setState("idle");
    socket.emit("cancel-search");
  }

  return (
    <>
      <div className="animate-fade-up">
        <h1 className="font-heading text-[28px] font-bold text-[#F8FAFC]">
          Practice Room
        </h1>
        <p className="mt-1 text-sm text-[#94A3B8]">
          Find a partner and practice IELTS speaking together
        </p>
      </div>

      <div className="animate-fade-up animate-fade-up-1 mt-6 flex items-center gap-5 rounded-xl border-[0.5px] border-[#2A3150] bg-[#1E2540] p-6">
        <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-full bg-[rgba(99,102,241,0.15)]">
          <Users size={28} strokeWidth={1.75} className="text-[#6366F1]" />
        </div>
        <div>
          <p className="flex items-center gap-2 text-lg font-medium text-[#F8FAFC]">
            {onlineCount} {onlineCount === 1 ? "student" : "students"} online
            <span className="pulse-dot h-2 w-2 rounded-full bg-[#22C55E]" />
          </p>
          <p className="mt-0.5 text-[13px] text-[#94A3B8]">Ready to practice now</p>
        </div>
      </div>

      <div className="animate-fade-up animate-fade-up-2 mt-4">
        {state === "idle" ? (
          <button
            onClick={handleFindPartner}
            className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#6366F1] py-4 text-base font-medium text-white transition-colors duration-200 hover:bg-[#818CF8]"
          >
            <Search size={20} strokeWidth={1.75} />
            Find Practice Partner
          </button>
        ) : state === "searching" ? (
          <div className="flex flex-col items-center gap-3 rounded-xl border-[0.5px] border-[#2A3150] bg-[#1E2540] py-8">
            <Loader size={28} strokeWidth={1.75} className="animate-spin text-[#6366F1]" />
            <p className="text-[15px] font-medium text-[#F8FAFC]">
              Searching for a partner...
            </p>
            <button
              onClick={handleCancel}
              className="mt-1 inline-flex cursor-pointer items-center gap-1.5 rounded-lg border-[0.5px] border-[#2A3150] px-4 py-2 text-sm text-[#94A3B8] transition-all duration-200 hover:border-[#6366F1] hover:text-white"
            >
              <X size={14} strokeWidth={1.75} />
              Cancel
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3 rounded-xl border-[0.5px] border-[#2A3150] bg-[#1E2540] py-8">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#6366F1] border-t-transparent" />
            <p className="text-[15px] font-medium text-[#22C55E]">
              Partner found! Connecting...
            </p>
          </div>
        )}
      </div>

      <section className="mt-8">
        <h2 className="animate-fade-up animate-fade-up-3 font-heading text-lg font-semibold text-[#F8FAFC]">
          How it works
        </h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          {steps.map((s, i) => (
            <div
              key={s.num}
              className={`animate-fade-up animate-fade-up-${i + 4} rounded-xl border-[0.5px] border-[#2A3150] bg-[#1E2540] p-5`}
            >
              <span className="font-heading text-[32px] font-bold text-[#6366F1]">
                {s.num}
              </span>
              <p className="mt-2 text-[15px] font-medium text-[#F8FAFC]">{s.title}</p>
              <p className="mt-1 text-[13px] text-[#64748B]">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-8">
        <h2 className="animate-fade-up animate-fade-up-7 font-heading text-lg font-semibold text-[#F8FAFC]">
          Recent Sessions
        </h2>
        <div className="animate-fade-up animate-fade-up-8 mt-4 flex flex-col items-center rounded-xl border-[0.5px] border-[#2A3150] bg-[#1E2540] py-8">
          <MessageSquare size={32} strokeWidth={1.5} className="text-[#64748B]" />
          <p className="mt-3 text-[15px] text-[#94A3B8]">No practice sessions yet</p>
          <p className="mt-1 text-[13px] text-[#64748B]">
            Find a partner to start your first session
          </p>
        </div>
      </section>
    </>
  );
}

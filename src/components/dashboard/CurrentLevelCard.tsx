import { ChevronRight } from "lucide-react";

export default function CurrentLevelCard() {
  const score = 4;
  const total = 308;
  const completed = 0;
  const progress = (completed / total) * 100;
  const radius = 36;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 9) * circumference;

  return (
    <div className="animate-fade-up animate-fade-up-1 group mt-6 flex cursor-pointer items-center gap-5 rounded-xl border-[0.5px] border-[#2A3150] bg-[#1E2540] p-5 transition-all duration-200 ease-out hover:-translate-y-0.5 hover:border-[rgba(99,102,241,0.3)]">
      <div className="relative flex-shrink-0">
        <svg width="88" height="88" viewBox="0 0 88 88">
          <circle
            cx="44"
            cy="44"
            r={radius}
            fill="none"
            stroke="#2A3150"
            strokeWidth="6"
          />
          <circle
            cx="44"
            cy="44"
            r={radius}
            fill="none"
            stroke="#6366F1"
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={circumference}
            className="animate-progress-ring"
            style={{
              "--ring-circumference": circumference,
              "--ring-target": strokeDashoffset,
            } as React.CSSProperties}
            transform="rotate(-90 44 44)"
          />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center font-heading text-2xl font-bold text-[#F8FAFC]">
          {score}
        </span>
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-xs text-[#64748B]">Current Level</p>
        <p className="mt-1 text-xl font-semibold text-[#F8FAFC]">
          Pre-Intermediate
        </p>
        <p className="mt-1 text-sm text-[#6366F1]">
          Start practicing to track your level!
        </p>
        <div className="mt-3">
          <p className="text-xs text-[#64748B]">
            {completed}/{total} practices
          </p>
          <div className="mt-1.5 h-1 w-full rounded-full bg-[#2A3150]">
            <div
              className="animate-progress-bar h-1 rounded-full bg-[#6366F1]"
              style={{ width: `${progress}%`, animationDelay: "0.6s" }}
            />
          </div>
        </div>
      </div>

      <ChevronRight
        size={20}
        strokeWidth={1.75}
        className="flex-shrink-0 text-[#64748B] transition-transform duration-200 group-hover:translate-x-0.5"
      />
    </div>
  );
}

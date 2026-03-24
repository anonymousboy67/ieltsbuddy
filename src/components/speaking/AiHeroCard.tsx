import { Sparkles, AudioLines, Mic, Volume2, Brain } from "lucide-react";

const pills = [
  { label: "Voice Chat", icon: Mic },
  { label: "AI Voice", icon: Volume2 },
  { label: "Smart AI", icon: Brain },
];

export default function AiHeroCard() {
  return (
    <div className="animate-fade-up animate-fade-up-1 group mt-6 cursor-pointer rounded-xl bg-gradient-to-r from-[#047857] to-[#4F46E5] p-6 transition-transform duration-200 ease-out hover:scale-[1.01]">
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <Sparkles size={14} strokeWidth={1.75} className="text-white/80" />
            <span className="text-[11px] font-medium uppercase tracking-wider text-white/80">
              AI Powered
            </span>
          </div>
          <h3 className="mt-2 font-heading text-2xl font-bold text-white">
            Talk with AI
          </h3>
          <p className="mt-1 text-sm text-white/80">
            Practice free conversation with human-like AI voice
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {pills.map((pill) => {
              const Icon = pill.icon;
              return (
                <span
                  key={pill.label}
                  className="flex items-center gap-1.5 rounded-full bg-[#FDF8F2]/15 px-3 py-1 text-xs text-white/80"
                >
                  <Icon size={12} strokeWidth={1.75} />
                  {pill.label}
                </span>
              );
            })}
          </div>
        </div>
        <div className="flex h-[60px] w-[60px] flex-shrink-0 items-center justify-center rounded-full bg-[#FDF8F2]/20">
          <AudioLines size={28} strokeWidth={1.75} className="text-white" />
        </div>
      </div>
    </div>
  );
}

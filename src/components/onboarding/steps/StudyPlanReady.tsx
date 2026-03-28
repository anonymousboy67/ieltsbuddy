import { Sparkles, TrendingUp, Target, BookOpen, Mic, Headphones, PenLine } from "lucide-react";

interface StudyPlanReadyProps {
  band: string;
  weaknesses: string[];
  estimatedBand: number;
  focusAreas: string[];
}

const SKILL_ICONS: Record<string, { icon: typeof Mic; color: string; bg: string }> = {
  speaking: { icon: Mic, color: "#0EA5E9", bg: "rgba(14,165,233,0.15)" },
  listening: { icon: Headphones, color: "#22C55E", bg: "rgba(34,197,94,0.15)" },
  reading: { icon: BookOpen, color: "#A855F7", bg: "rgba(168,85,247,0.15)" },
  writing: { icon: PenLine, color: "#F97316", bg: "rgba(249,115,22,0.15)" },
};

export default function StudyPlanReady({ band, weaknesses, estimatedBand, focusAreas }: StudyPlanReadyProps) {
  const targetBand = parseFloat(band) || 7.0;
  const improvement = Math.max(0, targetBand - estimatedBand).toFixed(1);

  return (
    <div className="flex flex-col items-center gap-6 text-center">
      {/* Icon */}
      <div className="relative">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-[#6366F1] to-[#4F46E5] shadow-[0_0_40px_rgba(99,102,241,0.3)]">
          <Sparkles size={36} strokeWidth={1.5} className="text-white" />
        </div>
      </div>

      <div>
        <h2 className="font-heading text-2xl font-bold text-[#F8FAFC]">
          Your Study Plan is Ready! 🎉
        </h2>
        <p className="mt-2 text-sm text-[#94A3B8]">
          Based on your diagnostic, we&apos;ve built a personalised IELTS roadmap just for you.
        </p>
      </div>

      {/* Band comparison */}
      <div className="w-full rounded-xl border-[0.5px] border-[#2A3150] bg-[#1E2540] p-4">
        <div className="flex items-center justify-around">
          <div className="text-center">
            <p className="text-xs text-[#64748B]">Estimated Level</p>
            <p className="mt-1 text-3xl font-bold text-[#F8FAFC]">{estimatedBand}</p>
            <p className="text-xs text-[#94A3B8]">Current Band</p>
          </div>
          <div className="flex flex-col items-center gap-1">
            <TrendingUp size={20} className="text-[#22C55E]" strokeWidth={1.75} />
            <p className="text-sm font-medium text-[#22C55E]">+{improvement}</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-[#64748B]">Your Goal</p>
            <p className="mt-1 text-3xl font-bold text-[#6366F1]">{targetBand}</p>
            <p className="text-xs text-[#94A3B8]">Target Band</p>
          </div>
        </div>
      </div>

      {/* Focus areas */}
      {focusAreas.length > 0 && (
        <div className="w-full">
          <div className="mb-3 flex items-center gap-2">
            <Target size={14} className="text-[#6366F1]" strokeWidth={1.75} />
            <p className="text-xs font-medium uppercase tracking-wider text-[#64748B]">
              Focus Areas
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {focusAreas.slice(0, 4).map((area) => {
              const skillKey = area.toLowerCase().replace(/\s.*/,"");
              const skillInfo = SKILL_ICONS[skillKey];
              const Icon = skillInfo?.icon ?? BookOpen;
              return (
                <div
                  key={area}
                  className="flex items-center gap-2 rounded-xl border-[0.5px] border-[#2A3150] bg-[#1E2540] p-3"
                >
                  <div
                    className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg"
                    style={{ backgroundColor: skillInfo?.bg ?? "rgba(99,102,241,0.15)" }}
                  >
                    <Icon size={16} strokeWidth={1.75} style={{ color: skillInfo?.color ?? "#6366F1" }} />
                  </div>
                  <span className="text-sm font-medium text-[#F8FAFC] capitalize">{area}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Weaknesses badge */}
      {weaknesses.length > 0 && (
        <div className="w-full rounded-xl border-[0.5px] border-[rgba(249,115,22,0.3)] bg-[rgba(249,115,22,0.06)] p-4">
          <p className="text-xs font-medium text-[#F59E0B]">Areas to Improve</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {weaknesses.map((w) => (
              <span
                key={w}
                className="rounded-full bg-[rgba(249,115,22,0.12)] px-3 py-1 text-xs text-[#F59E0B] capitalize"
              >
                {w}
              </span>
            ))}
          </div>
        </div>
      )}

      <p className="text-xs text-[#64748B]">
        Your full 7-day study plan is waiting in the dashboard.
      </p>
    </div>
  );
}

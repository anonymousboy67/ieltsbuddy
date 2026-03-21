interface WeekProgressProps {
  done: number;
  total: number;
}

export default function WeekProgress({ done, total }: WeekProgressProps) {
  const percent = total > 0 ? Math.round((done / total) * 100) : 0;

  function getColor(p: number) {
    if (p >= 75) return "#22C55E";
    if (p >= 40) return "#F59E0B";
    return "#EF4444";
  }

  return (
    <div className="animate-fade-up animate-fade-up-3 mt-4 rounded-xl border-[0.5px] border-[#2A3150] bg-[#1E2540] p-4">
      <div className="flex items-center justify-between">
        <div className="min-w-0 flex-1">
          <p className="text-[15px] font-medium text-[#F8FAFC]">This Week</p>
          <p className="mt-0.5 text-[13px] text-[#64748B]">
            {done}/{total} tasks done
          </p>
        </div>
        <span
          className="flex-shrink-0 text-2xl font-bold"
          style={{ color: getColor(percent) }}
        >
          {percent}%
        </span>
      </div>
      <div className="mt-3 h-1 w-full rounded-full bg-[#2A3150]">
        <div
          className="animate-progress-bar h-1 rounded-full bg-[#6366F1]"
          style={{ width: `${percent}%`, animationDelay: "0.5s" }}
        />
      </div>
    </div>
  );
}

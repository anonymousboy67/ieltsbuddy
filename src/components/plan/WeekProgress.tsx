interface WeekProgressProps {
  done: number;
  total: number;
}

export default function WeekProgress({ done, total }: WeekProgressProps) {
  const percent = total > 0 ? Math.round((done / total) * 100) : 0;

  function getColor(p: number) {
    if (p >= 75) return "#047857";
    if (p >= 40) return "#B45309";
    return "#B91C1C";
  }

  return (
    <div className="panel animate-fade-up animate-fade-up-3 mt-4 p-4">
      <div className="flex items-center justify-between">
        <div className="min-w-0 flex-1">
          <p className="text-[15px] font-medium text-stone-800">This Week</p>
          <p className="mt-0.5 text-[13px] text-stone-500">
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
      <div className="mt-3 h-1.5 w-full rounded-full bg-stone-100">
        <div
          className="animate-progress-bar h-1.5 rounded-full bg-emerald-700"
          style={{ width: `${percent}%`, animationDelay: "0.5s" }}
        />
      </div>
    </div>
  );
}

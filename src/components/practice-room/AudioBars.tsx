interface AudioBarsProps {
  color: string;
  label: string;
}

const barConfigs = [
  { maxH: "24px", duration: "0.7s", delay: "0s" },
  { maxH: "32px", duration: "0.9s", delay: "0.15s" },
  { maxH: "20px", duration: "0.6s", delay: "0.3s" },
  { maxH: "28px", duration: "0.8s", delay: "0.1s" },
  { maxH: "18px", duration: "0.75s", delay: "0.25s" },
];

export default function AudioBars({ color, label }: AudioBarsProps) {
  return (
    <div className="flex flex-col items-center gap-3">
      <div className="flex items-end gap-1 h-10">
        {barConfigs.map((cfg, i) => (
          <div
            key={i}
            className="audio-bar w-1.5 rounded-full"
            style={{
              backgroundColor: color,
              "--bar-max": cfg.maxH,
              "--bar-duration": cfg.duration,
              "--bar-delay": cfg.delay,
              height: "8px",
            } as React.CSSProperties}
          />
        ))}
      </div>
      <span className="text-xs text-[#64748B]">{label}</span>
    </div>
  );
}

interface BandScoreProps {
  value: string;
  onChange: (v: string) => void;
}

const options = [
  { band: "5.5", label: "Foundation level" },
  { band: "6.0", label: "Competent user" },
  { band: "6.5", label: "Good user" },
  { band: "7.0", label: "Very good user" },
  { band: "7.5", label: "Expert level" },
  { band: "8.0+", label: "Master level" },
];

export default function BandScore({ value, onChange }: BandScoreProps) {
  return (
    <div>
      <h2 className="font-heading text-2xl font-bold text-[#F8FAFC]">
        What&apos;s your target band score?
      </h2>
      <p className="mt-2 text-sm text-[#94A3B8]">
        This helps us create the right difficulty level.
      </p>
      <div className="mt-6 flex flex-col gap-3">
        {options.map((opt) => (
          <button
            key={opt.band}
            onClick={() => onChange(opt.band)}
            className={`cursor-pointer rounded-xl border-[0.5px] p-4 text-left transition-all duration-200 hover:-translate-y-0.5 ${
              value === opt.band
                ? "border-[#6366F1] bg-[rgba(99,102,241,0.1)]"
                : "border-[#2A3150] bg-[#1E2540] hover:border-[rgba(99,102,241,0.3)]"
            }`}
          >
            <span className="text-[15px] font-medium text-[#F8FAFC]">
              Band {opt.band}
            </span>
            <span className="ml-2 text-sm text-[#64748B]">{opt.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

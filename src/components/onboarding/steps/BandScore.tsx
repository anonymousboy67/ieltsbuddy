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
      <h2 className="font-heading text-2xl font-bold text-[#292524]">
        What&apos;s your target band score?
      </h2>
      <p className="mt-2 text-sm text-[#57534E]">
        This helps us create the right difficulty level.
      </p>
      <div className="mt-6 flex flex-col gap-3">
        {options.map((opt) => (
          <button
            key={opt.band}
            onClick={() => onChange(opt.band)}
            className={`cursor-pointer rounded-xl border-[0.5px] p-4 text-left transition-all duration-200 hover:-translate-y-0.5 ${
              value === opt.band
                ? "border-[#047857] bg-[rgba(4,120,87,0.10)]"
                : "border-[#E7E5E4] bg-[#FDF8F2] hover:border-[rgba(4,120,87,0.28)]"
            }`}
          >
            <span className="text-[15px] font-medium text-[#292524]">
              Band {opt.band}
            </span>
            <span className="ml-2 text-sm text-[#78716C]">{opt.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

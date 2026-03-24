import { GraduationCap, Briefcase } from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface TestTypeProps {
  value: string;
  onChange: (v: string) => void;
}

interface Option {
  id: string;
  label: string;
  desc: string;
  icon: LucideIcon;
}

const options: Option[] = [
  {
    id: "academic",
    label: "Academic",
    desc: "For higher education or professional registration",
    icon: GraduationCap,
  },
  {
    id: "general",
    label: "General Training",
    desc: "For migration, work, or secondary education",
    icon: Briefcase,
  },
];

export default function TestType({ value, onChange }: TestTypeProps) {
  return (
    <div>
      <h2 className="font-heading text-2xl font-bold text-[#292524]">
        Which IELTS test are you taking?
      </h2>
      <p className="mt-2 text-sm text-[#57534E]">
        We&apos;ll tailor the practice materials to your test type.
      </p>
      <div className="mt-6 flex flex-col gap-3">
        {options.map((opt) => {
          const Icon = opt.icon;
          const selected = value === opt.id;
          return (
            <button
              key={opt.id}
              onClick={() => onChange(opt.id)}
              className={`flex cursor-pointer items-center gap-4 rounded-xl border-[0.5px] p-4 text-left transition-all duration-200 hover:-translate-y-0.5 ${
                selected
                  ? "border-[#047857] bg-[rgba(4,120,87,0.10)]"
                  : "border-[#E7E5E4] bg-[#FDF8F2] hover:border-[rgba(4,120,87,0.28)]"
              }`}
            >
              <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-[rgba(4,120,87,0.15)]">
                <Icon size={24} strokeWidth={1.75} className="text-[#047857]" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[15px] font-medium text-[#292524]">{opt.label}</p>
                <p className="mt-0.5 text-sm text-[#78716C]">{opt.desc}</p>
              </div>
              <div
                className={`flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full border-2 ${
                  selected ? "border-[#047857] bg-[#047857]" : "border-[#E7E5E4]"
                }`}
              >
                {selected && (
                  <div className="h-2 w-2 rounded-full bg-[#FDF8F2]" />
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

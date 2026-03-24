import { Calendar } from "lucide-react";

interface TestDateProps {
  booked: boolean;
  onBookedChange: (v: boolean) => void;
  date: string;
  onDateChange: (v: string) => void;
}

export default function TestDate({
  booked,
  onBookedChange,
  date,
  onDateChange,
}: TestDateProps) {
  return (
    <div>
      <h2 className="font-heading text-2xl font-bold text-[#292524]">
        When is your IELTS test?
      </h2>
      <p className="mt-2 text-sm text-[#57534E]">
        We&apos;ll pace your study plan accordingly.
      </p>

      <div className="mt-6 flex items-center justify-between rounded-xl border-[0.5px] border-[#E7E5E4] bg-[#FDF8F2] p-4">
        <span className="text-[15px] font-medium text-[#292524]">
          I&apos;ve booked my test
        </span>
        <button
          onClick={() => onBookedChange(!booked)}
          className={`relative h-7 w-12 cursor-pointer rounded-full transition-colors duration-200 ${
            booked ? "bg-[#047857]" : "bg-[#E7E5E4]"
          }`}
          role="switch"
          aria-checked={booked}
        >
          <span
            className={`absolute top-1 left-1 h-5 w-5 rounded-full bg-[#FDF8F2] transition-transform duration-200 ${
              booked ? "translate-x-5" : "translate-x-0"
            }`}
          />
        </button>
      </div>

      {booked ? (
        <div className="mt-4">
          <input
            type="date"
            value={date}
            onChange={(e) => onDateChange(e.target.value)}
            className="w-full rounded-xl border-[0.5px] border-[#E7E5E4] bg-[#F8F5F1] px-4 py-3 text-sm text-[#292524] outline-none transition-colors focus:border-[#047857] [color-scheme:dark]"
          />
        </div>
      ) : (
        <div className="mt-4 flex items-start gap-3 rounded-xl border-[0.5px] border-[#E7E5E4] bg-[#FDF8F2] p-4">
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-[10px] bg-[rgba(4,120,87,0.15)]">
            <Calendar size={20} strokeWidth={1.75} className="text-[#047857]" />
          </div>
          <p className="text-sm text-[#57534E]">
            No worries! We&apos;ll create a flexible study plan you can adjust
            anytime.
          </p>
        </div>
      )}
    </div>
  );
}

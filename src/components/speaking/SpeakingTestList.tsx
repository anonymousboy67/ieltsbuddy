import Link from "next/link";
import {
  Mic,
  ChevronRight,
  Lock,
  List,
} from "lucide-react";

interface SpeakingTestGroup {
  key: string;
  name: string;
  parts: number;
  firstId: string;
}

interface SpeakingTestListProps {
  tests: SpeakingTestGroup[];
  loading: boolean;
}

const staggerClass = [
  "animate-fade-up-3",
  "animate-fade-up-4",
  "animate-fade-up-5",
  "animate-fade-up-6",
  "animate-fade-up-7",
  "animate-fade-up-8",
];

function Skeleton() {
  return (
    <div className="flex flex-col gap-3">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="flex items-center gap-4 rounded-xl border-[0.5px] border-[#2A3150] bg-[#1E2540] p-4"
        >
          <div className="h-11 w-11 animate-pulse rounded-xl bg-[#2A3150]" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-40 animate-pulse rounded bg-[#2A3150]" />
            <div className="h-3 w-20 animate-pulse rounded bg-[#2A3150]" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function SpeakingTestList({ tests, loading }: SpeakingTestListProps) {
  return (
    <section className="mt-7">
      <h2 className="animate-fade-up animate-fade-up-2 font-heading text-lg font-semibold text-[#F8FAFC]">
        Available Tests
      </h2>
      <div className="mt-4">
        {loading ? (
          <Skeleton />
        ) : tests.length === 0 ? (
          <div className="flex flex-col items-center rounded-xl border-[0.5px] border-[#2A3150] bg-[#1E2540] py-8">
            <Mic size={32} strokeWidth={1.5} className="text-[#64748B]" />
            <p className="mt-3 text-[15px] text-[#94A3B8]">No speaking tests available yet</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {tests.map((test, i) => {
              const isLocked = i > 0;
              const stagger = staggerClass[i] || staggerClass[staggerClass.length - 1];

              const className = `animate-fade-up ${stagger} group flex cursor-pointer items-center gap-4 rounded-xl border-[0.5px] border-[#2A3150] bg-[#1E2540] p-4 transition-all duration-200 ease-out ${
                isLocked
                  ? "opacity-60"
                  : "hover:-translate-y-0.5 hover:border-[rgba(99,102,241,0.3)]"
              }`;

              const content = (
                <>
                  <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-[rgba(14,165,233,0.15)]">
                    <Mic size={20} strokeWidth={1.75} className="text-[#0EA5E9]" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[15px] font-medium text-[#F8FAFC]">{test.name}</p>
                    {isLocked ? (
                      <p className="mt-1 text-[13px] text-[#64748B]">Premium Content</p>
                    ) : (
                      <div className="mt-1 flex items-center gap-4">
                        <span className="flex items-center gap-1.5 text-[13px] text-[#64748B]">
                          <List size={14} strokeWidth={1.75} />
                          {test.parts} Parts
                        </span>
                      </div>
                    )}
                  </div>
                  {isLocked ? (
                    <Lock size={18} strokeWidth={1.75} className="flex-shrink-0 text-[#64748B]" />
                  ) : (
                    <ChevronRight
                      size={20}
                      strokeWidth={1.75}
                      className="flex-shrink-0 text-[#64748B] transition-transform duration-200 group-hover:translate-x-0.5"
                    />
                  )}
                </>
              );

              return isLocked ? (
                <div key={test.key} className={className}>
                  {content}
                </div>
              ) : (
                <Link
                  key={test.key}
                  href={`/dashboard/speaking/${test.key}`}
                  className={className}
                >
                  {content}
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}

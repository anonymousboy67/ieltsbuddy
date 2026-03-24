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
          className="flex items-center gap-4 rounded-xl border border-stone-200 bg-[#FDF8F2] p-4"
        >
          <div className="h-11 w-11 animate-pulse rounded-xl bg-stone-200" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-40 animate-pulse rounded bg-stone-200" />
            <div className="h-3 w-20 animate-pulse rounded bg-stone-200" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function SpeakingTestList({ tests, loading }: SpeakingTestListProps) {
  return (
    <section className="mt-7">
      <h2 className="animate-fade-up animate-fade-up-2 font-heading text-lg font-semibold text-stone-800">
        Available Tests
      </h2>
      <div className="mt-4">
        {loading ? (
          <Skeleton />
        ) : tests.length === 0 ? (
          <div className="panel flex flex-col items-center py-8">
            <Mic size={32} strokeWidth={1.5} className="text-stone-500" />
            <p className="mt-3 text-[15px] text-stone-600">No speaking tests available yet</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {tests.map((test, i) => {
              const isLocked = i > 0;
              const stagger = staggerClass[i] || staggerClass[staggerClass.length - 1];

              const className = `panel animate-fade-up ${stagger} group flex cursor-pointer items-center gap-4 p-4 transition-all duration-200 ease-out ${
                isLocked
                  ? "opacity-60"
                  : "hover:-translate-y-0.5 hover:bg-stone-50"
              }`;

              const content = (
                <>
                  <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-teal-50">
                    <Mic size={20} strokeWidth={1.75} className="text-teal-700" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[15px] font-medium text-stone-800">{test.name}</p>
                    {isLocked ? (
                      <p className="mt-1 text-[13px] text-stone-500">Premium Content</p>
                    ) : (
                      <div className="mt-1 flex items-center gap-4">
                        <span className="flex items-center gap-1.5 text-[13px] text-stone-500">
                          <List size={14} strokeWidth={1.75} />
                          {test.parts} Parts
                        </span>
                      </div>
                    )}
                  </div>
                  {isLocked ? (
                    <Lock size={18} strokeWidth={1.75} className="flex-shrink-0 text-stone-500" />
                  ) : (
                    <ChevronRight
                      size={20}
                      strokeWidth={1.75}
                      className="flex-shrink-0 text-stone-500 transition-transform duration-200 group-hover:translate-x-0.5"
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

import Link from "next/link";
import {
  Mic,
  ChevronRight,
  Lock,
  List,
  CheckCircle,
} from "lucide-react";

interface SpeakingTest {
  id: string;
  name: string;
  parts: number;
  completed: number;
  locked: boolean;
}

const tests: SpeakingTest[] = [
  { id: "test-1", name: "IELTS Book 10 Test 1", parts: 3, completed: 0, locked: false },
  { id: "test-2", name: "IELTS Book 10 Test 2", parts: 3, completed: 0, locked: true },
  { id: "test-3", name: "IELTS Book 10 Test 3", parts: 3, completed: 0, locked: true },
  { id: "test-4", name: "IELTS Book 10 Test 4", parts: 3, completed: 0, locked: true },
];

const staggerClass = [
  "animate-fade-up-3",
  "animate-fade-up-4",
  "animate-fade-up-5",
  "animate-fade-up-6",
];

export default function SpeakingTestList() {
  return (
    <section className="mt-7">
      <h2 className="animate-fade-up animate-fade-up-2 font-heading text-lg font-semibold text-[#F8FAFC]">
        Available Tests
      </h2>
      <div className="mt-4 flex flex-col gap-3">
        {tests.map((test, i) => {
          const className = `animate-fade-up ${staggerClass[i]} group flex cursor-pointer items-center gap-4 rounded-xl border-[0.5px] border-[#2A3150] bg-[#1E2540] p-4 transition-all duration-200 ease-out ${
            test.locked
              ? "opacity-60"
              : "hover:-translate-y-0.5 hover:border-[rgba(99,102,241,0.3)]"
          }`;

          const content = (
            <>
              <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-[rgba(14,165,233,0.15)]">
                <Mic size={20} strokeWidth={1.75} className="text-[#0EA5E9]" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[15px] font-medium text-[#F8FAFC]">
                  {test.name}
                </p>
                {test.locked ? (
                  <p className="mt-1 text-[13px] text-[#64748B]">Premium Content</p>
                ) : (
                  <div className="mt-1 flex items-center gap-4">
                    <span className="flex items-center gap-1.5 text-[13px] text-[#64748B]">
                      <List size={14} strokeWidth={1.75} />
                      {test.parts} Parts
                    </span>
                    <span className="flex items-center gap-1.5 text-[13px] text-[#64748B]">
                      <CheckCircle size={14} strokeWidth={1.75} />
                      {test.completed}/{test.parts} Completed
                    </span>
                  </div>
                )}
              </div>
              {test.locked ? (
                <Lock size={18} strokeWidth={1.75} className="flex-shrink-0 text-[#64748B]" />
              ) : (
                <ChevronRight size={20} strokeWidth={1.75} className="flex-shrink-0 text-[#64748B] transition-transform duration-200 group-hover:translate-x-0.5" />
              )}
            </>
          );

          return test.locked ? (
            <div key={test.id} className={className}>{content}</div>
          ) : (
            <Link key={test.id} href={`/dashboard/speaking/${test.id}`} className={className}>{content}</Link>
          );
        })}
      </div>
    </section>
  );
}

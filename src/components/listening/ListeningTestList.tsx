import {
  Headphones,
  ChevronRight,
  Lock,
  List,
  HelpCircle,
} from "lucide-react";

interface ListeningTest {
  name: string;
  sections: number;
  questions: number;
  locked: boolean;
}

const tests: ListeningTest[] = [
  { name: "IELTS Book 10 Test 1", sections: 4, questions: 40, locked: false },
  { name: "IELTS Book 10 Test 2", sections: 4, questions: 40, locked: true },
  { name: "IELTS Book 10 Test 3", sections: 4, questions: 40, locked: true },
  { name: "IELTS Book 10 Test 4", sections: 4, questions: 40, locked: true },
  { name: "IELTS Book 11 Test 1", sections: 4, questions: 40, locked: true },
  { name: "IELTS Book 11 Test 2", sections: 4, questions: 40, locked: true },
];

const staggerClass = [
  "animate-fade-up-2",
  "animate-fade-up-3",
  "animate-fade-up-4",
  "animate-fade-up-5",
  "animate-fade-up-6",
  "animate-fade-up-7",
];

export default function ListeningTestList() {
  return (
    <section className="mt-6">
      <h2 className="animate-fade-up animate-fade-up-1 font-heading text-lg font-semibold text-[#F8FAFC]">
        Available Tests
      </h2>
      <div className="mt-4 flex flex-col gap-3">
        {tests.map((test, i) => (
          <div
            key={i}
            className={`animate-fade-up ${staggerClass[i]} group flex cursor-pointer items-center gap-4 rounded-xl border-[0.5px] border-[#2A3150] bg-[#1E2540] p-4 transition-all duration-200 ease-out ${
              test.locked
                ? "opacity-60"
                : "hover:-translate-y-0.5 hover:border-[rgba(99,102,241,0.3)]"
            }`}
          >
            <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-[rgba(34,197,94,0.15)]">
              <Headphones size={20} strokeWidth={1.75} className="text-[#22C55E]" />
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-[15px] font-medium text-[#F8FAFC]">
                {test.name}
              </p>
              {test.locked ? (
                <p className="mt-1 text-[13px] text-[#64748B]">
                  Premium Content
                </p>
              ) : (
                <div className="mt-1 flex items-center gap-4">
                  <span className="flex items-center gap-1.5 text-[13px] text-[#64748B]">
                    <List size={14} strokeWidth={1.75} />
                    {test.sections} Sections
                  </span>
                  <span className="flex items-center gap-1.5 text-[13px] text-[#64748B]">
                    <HelpCircle size={14} strokeWidth={1.75} />
                    {test.questions} Questions
                  </span>
                </div>
              )}
            </div>

            {test.locked ? (
              <Lock
                size={18}
                strokeWidth={1.75}
                className="flex-shrink-0 text-[#64748B]"
              />
            ) : (
              <ChevronRight
                size={20}
                strokeWidth={1.75}
                className="flex-shrink-0 text-[#64748B] transition-transform duration-200 group-hover:translate-x-0.5"
              />
            )}
          </div>
        ))}
      </div>
    </section>
  );
}

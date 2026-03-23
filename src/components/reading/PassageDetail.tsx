import { Tag, HelpCircle } from "lucide-react";

const typeLabels: Record<string, string> = {
  "true-false-not-given": "True/False/Not Given",
  "yes-no-not-given": "Yes/No/Not Given",
  "multiple-choice": "Multiple Choice",
  "matching-headings": "Matching Headings",
  "matching-information": "Matching Information",
  "matching-features": "Matching Features",
  "matching-sentence-endings": "Matching Sentence Endings",
  "sentence-completion": "Sentence Completion",
  "summary-completion": "Summary Completion",
  "note-completion": "Note Completion",
  "table-completion": "Table Completion",
  "diagram-label-completion": "Diagram Label Completion",
  "short-answer": "Short Answer",
};

interface QuestionGroup {
  groupLabel: string;
  questionType: string;
  questions: { questionNumber: number }[];
}

interface PassageData {
  title: string;
  topic: string;
  passage: string;
  questionGroups: QuestionGroup[];
}

interface PassageDetailProps {
  data: PassageData;
}

export default function PassageDetail({ data }: PassageDetailProps) {
  const questionTypes = data.questionGroups.map((g) => ({
    name: typeLabels[g.questionType] || g.questionType,
    count: g.questions.length,
  }));

  const totalQuestions = data.questionGroups.reduce(
    (sum, g) => sum + g.questions.length,
    0
  );

  const preview = data.passage.slice(0, 200);

  return (
    <div key={data.title} className="animate-step-enter">
      <h2 className="font-heading text-[22px] font-bold text-[#F8FAFC]">
        {data.title}
      </h2>
      <div className="mt-3 flex flex-wrap items-center gap-4">
        <span className="flex items-center gap-1.5 text-sm text-[#6366F1]">
          <Tag size={14} strokeWidth={1.75} />
          {data.topic}
        </span>
        <span className="flex items-center gap-1.5 text-sm text-[#64748B]">
          <HelpCircle size={14} strokeWidth={1.75} />
          {totalQuestions} Questions
        </span>
      </div>

      <section className="mt-6">
        <h3 className="text-base font-semibold text-[#F8FAFC]">
          Question Types
        </h3>
        <div className="mt-3">
          {questionTypes.map((qt, i) => (
            <div
              key={qt.name}
              className={`flex items-center justify-between py-2.5 ${
                i < questionTypes.length - 1
                  ? "border-b-[0.5px] border-[#2A3150]"
                  : ""
              }`}
            >
              <span className="flex items-center gap-2.5 text-sm text-[#94A3B8]">
                <span className="h-1.5 w-1.5 rounded-full bg-[#EF4444]" />
                {qt.name}
              </span>
              <span className="text-sm font-medium text-[#64748B]">
                {qt.count}
              </span>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-6">
        <h3 className="text-base font-semibold text-[#F8FAFC]">Preview</h3>
        <div className="relative mt-3 overflow-hidden rounded-xl border-[0.5px] border-[#2A3150] bg-[#1E2540] p-4">
          <p className="text-sm italic text-[#94A3B8]">{preview}...</p>
          <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-[#1E2540] to-transparent" />
        </div>
      </section>
    </div>
  );
}

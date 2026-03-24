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
      <h2 className="font-heading text-[22px] font-bold text-[#292524]">
        {data.title}
      </h2>
      <div className="mt-3 flex flex-wrap items-center gap-4">
        <span className="flex items-center gap-1.5 text-sm text-[#047857]">
          <Tag size={14} strokeWidth={1.75} />
          {data.topic}
        </span>
        <span className="flex items-center gap-1.5 text-sm text-[#78716C]">
          <HelpCircle size={14} strokeWidth={1.75} />
          {totalQuestions} Questions
        </span>
      </div>

      <section className="mt-6">
        <h3 className="text-base font-semibold text-[#292524]">
          Question Types
        </h3>
        <div className="mt-3">
          {questionTypes.map((qt, i) => (
            <div
              key={qt.name}
              className={`flex items-center justify-between py-2.5 ${
                i < questionTypes.length - 1
                  ? "border-b-[0.5px] border-[#E7E5E4]"
                  : ""
              }`}
            >
              <span className="flex items-center gap-2.5 text-sm text-[#57534E]">
                <span className="h-1.5 w-1.5 rounded-full bg-[#B91C1C]" />
                {qt.name}
              </span>
              <span className="text-sm font-medium text-[#78716C]">
                {qt.count}
              </span>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-6">
        <h3 className="text-base font-semibold text-[#292524]">Preview</h3>
        <div className="relative mt-3 overflow-hidden rounded-xl border-[0.5px] border-[#E7E5E4] bg-[#FDF8F2] p-4">
          <p className="text-sm italic text-[#57534E]">{preview}...</p>
          <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-[#FFFFFF] to-transparent" />
        </div>
      </section>
    </div>
  );
}

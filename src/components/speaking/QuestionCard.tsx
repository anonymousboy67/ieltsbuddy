interface QuestionCardProps {
  questionIndex: number;
  totalQuestions: number;
  questionText: string;
}

export default function QuestionCard({
  questionIndex,
  totalQuestions,
  questionText,
}: QuestionCardProps) {
  return (
    <div className="mt-5 rounded-xl border-[0.5px] border-[#2A3150] bg-[#1E2540] p-6">
      <span className="text-xs text-[#64748B]">
        Question {questionIndex + 1} of {totalQuestions}
      </span>
      <p className="mt-2 text-lg font-medium text-[#F8FAFC]">{questionText}</p>
      <div className="mt-5 flex items-center justify-center gap-2">
        {Array.from({ length: totalQuestions }).map((_, i) => (
          <span
            key={i}
            className={`rounded-full transition-all duration-200 ${
              i === questionIndex
                ? "h-2 w-2 bg-[#6366F1]"
                : "h-1.5 w-1.5 bg-[#2A3150]"
            }`}
          />
        ))}
      </div>
    </div>
  );
}

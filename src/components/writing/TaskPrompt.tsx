import { ImageIcon } from "lucide-react";

interface TaskPromptProps {
  taskNumber: number;
  instruction: string;
  minWords: number;
  timeMinutes: number;
}

export default function TaskPrompt({
  taskNumber,
  instruction,
  minWords,
  timeMinutes,
}: TaskPromptProps) {
  return (
    <div className="animate-fade-up animate-fade-up-1 rounded-xl border-[0.5px] border-[#2A3150] bg-[#1E2540] p-5">
      <span className="text-xs font-medium uppercase tracking-wider text-[#6366F1]">
        Task {taskNumber}
      </span>
      <p className="mt-2 text-[15px] text-[#F8FAFC]">{instruction}</p>

      <div className="mt-4 flex h-[200px] items-center justify-center rounded-lg bg-[#12172B]">
        <div className="flex flex-col items-center gap-2">
          <ImageIcon size={32} strokeWidth={1.5} className="text-[#64748B]" />
          <span className="text-[13px] text-[#64748B]">
            Chart will appear here
          </span>
        </div>
      </div>

      <p className="mt-3 text-[13px] text-[#64748B]">
        Write at least {minWords} words. Spend about {timeMinutes} minutes on
        this task.
      </p>
    </div>
  );
}

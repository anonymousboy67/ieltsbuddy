import { ImageIcon } from "lucide-react";
import Image from "next/image";

interface TaskPromptProps {
  taskNumber: number;
  instruction: string;
  minWords: number;
  timeMinutes: number;
  imageUrl?: string;
}

export default function TaskPrompt({
  taskNumber,
  instruction,
  minWords,
  timeMinutes,
  imageUrl,
}: TaskPromptProps) {
  return (
    <div className="animate-fade-up animate-fade-up-1 rounded-xl border-[0.5px] border-[#E7E5E4] bg-[#FDF8F2] p-5">
      <span className="text-xs font-medium uppercase tracking-wider text-[#047857]">
        Task {taskNumber}
      </span>
      <p className="mt-2 text-[15px] text-[#292524]">{instruction}</p>

      <div className="mt-4 flex min-h-[200px] items-center justify-center overflow-hidden rounded-lg bg-[#F8F5F1]">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt="Task image"
            width={600}
            height={400}
            className="h-auto max-h-[400px] w-full object-contain"
          />
        ) : (
          <div className="flex flex-col items-center gap-2">
            <ImageIcon size={32} strokeWidth={1.5} className="text-[#78716C]" />
            <span className="text-[13px] text-[#78716C]">
              Chart will appear here
            </span>
          </div>
        )}
      </div>

      <p className="mt-3 text-[13px] text-[#78716C]">
        Write at least {minWords} words. Spend about {timeMinutes} minutes on
        this task.
      </p>
    </div>
  );
}

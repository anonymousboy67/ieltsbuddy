import Link from "next/link";
import { ArrowLeft, Clock } from "lucide-react";
import TaskPrompt from "@/components/writing/TaskPrompt";
import WritingEditor from "@/components/writing/WritingEditor";

export default function WritingTaskPage() {
  return (
    <>
      <div className="animate-fade-up flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/writing"
            className="flex h-10 w-10 items-center justify-center rounded-full border-[0.5px] border-[#2A3150] bg-[#1E2540] transition-all duration-200 hover:border-[rgba(99,102,241,0.3)]"
          >
            <ArrowLeft size={20} strokeWidth={1.75} className="text-[#94A3B8]" />
          </Link>
          <h1 className="text-base font-medium text-[#F8FAFC]">
            Writing Task 1
          </h1>
        </div>
        <span className="flex items-center gap-1.5 text-sm text-[#64748B]">
          <Clock size={16} strokeWidth={1.75} />
          20:00
        </span>
      </div>

      <div className="mt-6">
        <TaskPrompt
          taskNumber={1}
          instruction="The chart below shows the number of households in the US by their annual income in 2007, 2011, and 2015."
          minWords={150}
          timeMinutes={20}
        />
        <WritingEditor minWords={150} />
      </div>
    </>
  );
}

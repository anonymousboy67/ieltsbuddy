"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Clock } from "lucide-react";
import TaskPrompt from "@/components/writing/TaskPrompt";
import WritingEditor from "@/components/writing/WritingEditor";

interface WritingTaskData {
  _id: string;
  bookNumber: number;
  testNumber: number;
  taskType: "task1" | "task2";
  title: string;
  instructions: string;
  imageUrl?: string;
  wordRequirement: number;
  timeMinutes: number;
}

export default function WritingTaskPage() {
  const { id } = useParams<{ id: string }>();
  const [task, setTask] = useState<WritingTaskData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchTask() {
      try {
        const res = await fetch(`/api/content/writing/${id}`);
        if (res.ok) {
          setTask(await res.json());
        }
      } catch {
        // empty
      } finally {
        setLoading(false);
      }
    }
    fetchTask();
  }, [id]);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 animate-pulse rounded-full bg-[#FDF8F2]" />
          <div className="h-5 w-32 animate-pulse rounded bg-[#FDF8F2]" />
        </div>
        <div className="h-48 animate-pulse rounded-xl bg-[#FDF8F2]" />
        <div className="h-64 animate-pulse rounded-xl bg-[#FDF8F2]" />
      </div>
    );
  }

  if (!task) {
    return (
      <div className="flex min-h-[300px] flex-col items-center justify-center gap-4">
        <p className="text-[15px] text-[#57534E]">Task not found</p>
        <Link
          href="/dashboard/writing"
          className="rounded-xl bg-[#047857] px-6 py-3 text-sm font-medium text-white hover:bg-[#0F766E]"
        >
          Back to Writing Lab
        </Link>
      </div>
    );
  }

  const taskNumber = task.taskType === "task1" ? 1 : 2;

  return (
    <>
      <div className="animate-fade-up flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/writing"
            className="flex h-10 w-10 items-center justify-center rounded-full border-[0.5px] border-[#E7E5E4] bg-[#FDF8F2] transition-all duration-200 hover:border-[rgba(4,120,87,0.28)]"
          >
            <ArrowLeft size={20} strokeWidth={1.75} className="text-[#57534E]" />
          </Link>
          <h1 className="text-base font-medium text-[#292524]">
            {task.title || `Writing Task ${taskNumber}`}
          </h1>
        </div>
        <span className="flex items-center gap-1.5 text-sm text-[#78716C]">
          <Clock size={16} strokeWidth={1.75} />
          {task.timeMinutes}:00
        </span>
      </div>

      <div className="mt-6">
        <TaskPrompt
          taskNumber={taskNumber}
          instruction={task.instructions}
          minWords={task.wordRequirement}
          timeMinutes={task.timeMinutes}
          imageUrl={task.imageUrl}
        />
        <WritingEditor
          minWords={task.wordRequirement}
          taskInstructions={task.instructions}
          taskType={task.taskType}
        />
      </div>
    </>
  );
}

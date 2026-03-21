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
          <div className="h-10 w-10 animate-pulse rounded-full bg-[#1E2540]" />
          <div className="h-5 w-32 animate-pulse rounded bg-[#1E2540]" />
        </div>
        <div className="h-48 animate-pulse rounded-xl bg-[#1E2540]" />
        <div className="h-64 animate-pulse rounded-xl bg-[#1E2540]" />
      </div>
    );
  }

  if (!task) {
    return (
      <div className="flex min-h-[300px] flex-col items-center justify-center gap-4">
        <p className="text-[15px] text-[#94A3B8]">Task not found</p>
        <Link
          href="/dashboard/writing"
          className="rounded-xl bg-[#6366F1] px-6 py-3 text-sm font-medium text-white hover:bg-[#818CF8]"
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
            className="flex h-10 w-10 items-center justify-center rounded-full border-[0.5px] border-[#2A3150] bg-[#1E2540] transition-all duration-200 hover:border-[rgba(99,102,241,0.3)]"
          >
            <ArrowLeft size={20} strokeWidth={1.75} className="text-[#94A3B8]" />
          </Link>
          <h1 className="text-base font-medium text-[#F8FAFC]">
            {task.title || `Writing Task ${taskNumber}`}
          </h1>
        </div>
        <span className="flex items-center gap-1.5 text-sm text-[#64748B]">
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

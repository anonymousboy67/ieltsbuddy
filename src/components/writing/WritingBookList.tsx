import Link from "next/link";
import {
  PenLine,
  ChevronRight,
  List,
} from "lucide-react";

interface WritingTask {
  _id: string;
  bookNumber: number;
  testNumber: number;
  taskType: "task1" | "task2";
  title: string;
}

interface BookGroup {
  bookNumber: number;
  name: string;
  tasks: WritingTask[];
  task1Count: number;
  task2Count: number;
}

interface WritingBookListProps {
  books: BookGroup[];
  loading: boolean;
  taskType: "task1" | "task2";
}

const staggerClass = [
  "animate-fade-up-4",
  "animate-fade-up-5",
  "animate-fade-up-6",
  "animate-fade-up-7",
  "animate-fade-up-8",
  "animate-fade-up-9",
];

function Skeleton() {
  return (
    <div className="flex flex-col gap-3">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="flex items-center gap-4 rounded-xl border-[0.5px] border-[#2A3150] bg-[#1E2540] p-4"
        >
          <div className="h-11 w-11 animate-pulse rounded-xl bg-[#2A3150]" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-32 animate-pulse rounded bg-[#2A3150]" />
            <div className="h-3 w-20 animate-pulse rounded bg-[#2A3150]" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function WritingBookList({ books, loading, taskType }: WritingBookListProps) {
  if (loading) {
    return (
      <section>
        <h2 className="animate-fade-up animate-fade-up-3 font-heading text-lg font-semibold text-[#F8FAFC]">
          Available Books
        </h2>
        <div className="mt-4">
          <Skeleton />
        </div>
      </section>
    );
  }

  if (books.length === 0) {
    return (
      <section>
        <h2 className="animate-fade-up animate-fade-up-3 font-heading text-lg font-semibold text-[#F8FAFC]">
          Available Books
        </h2>
        <div className="mt-4 flex flex-col items-center rounded-xl border-[0.5px] border-[#2A3150] bg-[#1E2540] py-8">
          <PenLine size={32} strokeWidth={1.5} className="text-[#64748B]" />
          <p className="mt-3 text-[15px] text-[#94A3B8]">No writing tasks available yet</p>
        </div>
      </section>
    );
  }

  return (
    <section>
      <h2 className="animate-fade-up animate-fade-up-3 font-heading text-lg font-semibold text-[#F8FAFC]">
        Available Books
      </h2>
      <div className="mt-4 flex flex-col gap-3">
        {books.map((book, i) => {
          const taskCount = taskType === "task1" ? book.task1Count : book.task2Count;
          const firstTask = book.tasks.find((t) => t.taskType === taskType);
          const stagger = staggerClass[i] || staggerClass[staggerClass.length - 1];

          const className = `animate-fade-up ${stagger} group flex cursor-pointer items-center gap-4 rounded-xl border-[0.5px] border-[#2A3150] bg-[#1E2540] p-4 transition-all duration-200 ease-out hover:-translate-y-0.5 hover:border-[rgba(99,102,241,0.3)]`;

          const content = (
            <>
              <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-[rgba(249,115,22,0.15)]">
                <PenLine size={20} strokeWidth={1.75} className="text-[#F97316]" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[15px] font-medium text-[#F8FAFC]">{book.name}</p>
                <div className="mt-1 flex items-center gap-4">
                  <span className="flex items-center gap-1.5 text-[13px] text-[#64748B]">
                    <List size={14} strokeWidth={1.75} />
                    {taskCount} {taskCount === 1 ? "Task" : "Tasks"}
                  </span>
                </div>
              </div>
              <ChevronRight
                size={20}
                strokeWidth={1.75}
                className="flex-shrink-0 text-[#64748B] transition-transform duration-200 group-hover:translate-x-0.5"
              />
            </>
          );

          return !firstTask ? (
            <div key={book.bookNumber} className={className}>
              {content}
            </div>
          ) : (
            <Link
              key={book.bookNumber}
              href={`/dashboard/writing/task/${firstTask._id}`}
              className={className}
            >
              {content}
            </Link>
          );
        })}
      </div>
    </section>
  );
}

import Link from "next/link";
import {
  PenLine,
  ChevronRight,
  Lock,
  List,
  CheckCircle,
} from "lucide-react";

interface WritingBook {
  id: string;
  name: string;
  tests: number;
  tasks: number;
  completed: number;
  locked: boolean;
}

const books: WritingBook[] = [
  { id: "book-10", name: "IELTS Book 10", tests: 4, tasks: 8, completed: 0, locked: false },
  { id: "book-11", name: "IELTS Book 11", tests: 4, tasks: 8, completed: 0, locked: true },
  { id: "book-12", name: "IELTS Book 12", tests: 4, tasks: 8, completed: 0, locked: true },
  { id: "book-13", name: "IELTS Book 13", tests: 4, tasks: 8, completed: 0, locked: true },
  { id: "book-14", name: "IELTS Book 14", tests: 4, tasks: 8, completed: 0, locked: true },
  { id: "book-15", name: "IELTS Book 15", tests: 4, tasks: 8, completed: 0, locked: true },
];

const staggerClass = [
  "animate-fade-up-4",
  "animate-fade-up-5",
  "animate-fade-up-6",
  "animate-fade-up-7",
  "animate-fade-up-8",
  "animate-fade-up-9",
];

export default function WritingBookList() {
  return (
    <section>
      <h2 className="animate-fade-up animate-fade-up-3 font-heading text-lg font-semibold text-[#F8FAFC]">
        Available Books
      </h2>
      <div className="mt-4 flex flex-col gap-3">
        {books.map((book, i) => {
          const className = `animate-fade-up ${staggerClass[i]} group flex cursor-pointer items-center gap-4 rounded-xl border-[0.5px] border-[#2A3150] bg-[#1E2540] p-4 transition-all duration-200 ease-out ${
            book.locked
              ? "opacity-60"
              : "hover:-translate-y-0.5 hover:border-[rgba(99,102,241,0.3)]"
          }`;

          const content = (
            <>
              <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-[rgba(249,115,22,0.15)]">
                <PenLine size={20} strokeWidth={1.75} className="text-[#F97316]" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[15px] font-medium text-[#F8FAFC]">
                  {book.name}
                </p>
                {book.locked ? (
                  <p className="mt-1 text-[13px] text-[#64748B]">Premium Content</p>
                ) : (
                  <div className="mt-1 flex items-center gap-4">
                    <span className="flex items-center gap-1.5 text-[13px] text-[#64748B]">
                      <List size={14} strokeWidth={1.75} />
                      {book.tests} Tests
                    </span>
                    <span className="flex items-center gap-1.5 text-[13px] text-[#64748B]">
                      <CheckCircle size={14} strokeWidth={1.75} />
                      {book.completed}/{book.tasks} Tasks
                    </span>
                  </div>
                )}
              </div>
              {book.locked ? (
                <Lock size={18} strokeWidth={1.75} className="flex-shrink-0 text-[#64748B]" />
              ) : (
                <ChevronRight size={20} strokeWidth={1.75} className="flex-shrink-0 text-[#64748B] transition-transform duration-200 group-hover:translate-x-0.5" />
              )}
            </>
          );

          return book.locked ? (
            <div key={book.id} className={className}>{content}</div>
          ) : (
            <Link key={book.id} href={`/dashboard/writing/${book.id}/task-1`} className={className}>{content}</Link>
          );
        })}
      </div>
    </section>
  );
}

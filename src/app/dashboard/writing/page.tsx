import TaskToggle from "@/components/writing/TaskToggle";

export default function WritingPage() {
  return (
    <>
      <div className="animate-fade-up">
        <h1 className="font-heading text-[28px] font-bold text-[#F8FAFC]">
          Writing Lab
        </h1>
        <p className="mt-1 text-sm text-[#94A3B8]">
          Practice IELTS Academic Writing Tasks
        </p>
      </div>
      <TaskToggle />
    </>
  );
}

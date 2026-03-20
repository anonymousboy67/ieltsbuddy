import ReadingTestList from "@/components/reading/ReadingTestList";

export default function ReadingPage() {
  return (
    <>
      <div className="animate-fade-up">
        <h1 className="font-heading text-[28px] font-bold text-[#F8FAFC]">
          Reading Practice
        </h1>
        <p className="mt-1 text-sm text-[#94A3B8]">
          Real IELTS Reading Tests
        </p>
      </div>
      <ReadingTestList />
    </>
  );
}

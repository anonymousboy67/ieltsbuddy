import ListeningTestList from "@/components/listening/ListeningTestList";

export default function ListeningPage() {
  return (
    <>
      <div className="animate-fade-up">
        <h1 className="font-heading text-[28px] font-bold text-[#292524]">
          Listening Practice
        </h1>
        <p className="mt-1 text-sm text-[#57534E]">
          Real IELTS Listening Tests
        </p>
      </div>
      <ListeningTestList />
    </>
  );
}

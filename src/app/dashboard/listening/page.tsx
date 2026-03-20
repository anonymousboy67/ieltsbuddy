import ListeningTestList from "@/components/listening/ListeningTestList";

export default function ListeningPage() {
  return (
    <>
      <div className="animate-fade-up">
        <h1 className="font-heading text-[28px] font-bold text-[#F8FAFC]">
          Listening Practice
        </h1>
        <p className="mt-1 text-sm text-[#94A3B8]">
          Real IELTS Listening Tests
        </p>
      </div>
      <ListeningTestList />
    </>
  );
}

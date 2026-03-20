import AiHeroCard from "@/components/speaking/AiHeroCard";
import SpeakingTestList from "@/components/speaking/SpeakingTestList";

export default function SpeakingPage() {
  return (
    <>
      <div className="animate-fade-up">
        <h1 className="font-heading text-[28px] font-bold text-[#F8FAFC]">
          Speaking Practice
        </h1>
        <p className="mt-1 text-sm text-[#94A3B8]">
          Real IELTS Speaking Tests
        </p>
      </div>
      <AiHeroCard />
      <SpeakingTestList />
    </>
  );
}

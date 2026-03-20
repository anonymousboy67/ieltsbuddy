import GreetingHeader from "@/components/dashboard/GreetingHeader";
import CurrentLevelCard from "@/components/dashboard/CurrentLevelCard";
import PracticeArea from "@/components/dashboard/PracticeArea";
import ContinueLearning from "@/components/dashboard/ContinueLearning";

export default function DashboardPage() {
  return (
    <>
      <GreetingHeader />
      <CurrentLevelCard />
      <PracticeArea />
      <ContinueLearning />
    </>
  );
}

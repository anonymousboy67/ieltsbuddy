import { Suspense } from "react";
import PracticeCall from "@/components/practice-room/PracticeCall";

function CallLoader() {
  return (
    <div className="flex min-h-[400px] items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#047857] border-t-transparent" />
    </div>
  );
}

export default function CallPage() {
  return (
    <Suspense fallback={<CallLoader />}>
      <PracticeCall />
    </Suspense>
  );
}

"use client";

import { useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import Sidebar from "./Sidebar";
import BottomNav from "./BottomNav";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [checked, setChecked] = useState(false);
  // Prevent double-redirect if the effect fires twice during navigation
  const redirectingRef = useRef(false);

  useEffect(() => {
    if (status === "loading") return;
    if (redirectingRef.current) return;

    if (!session) {
      redirectingRef.current = true;
      router.replace("/");
      return;
    }

    // Always verify onboarding from DB — never trust the JWT value alone,
    // since the JWT may be stale (e.g. immediately after onboarding completes).
    fetch("/api/user/onboarding-status")
      .then((r) => r.json())
      .then((data) => {
        if (!data.onboardingComplete) {
          redirectingRef.current = true;
          router.replace("/onboarding");
        } else {
          setChecked(true);
        }
      })
      .catch(() => {
        // If the status API fails, fall back to JWT value and let them through
        // to avoid locking users out on a network blip.
        const onboardingDone = (session as any).onboardingComplete ?? false;
        if (!onboardingDone) {
          redirectingRef.current = true;
          router.replace("/onboarding");
        } else {
          setChecked(true);
        }
      });
  }, [session, status, router]);

  if (status === "loading" || !checked) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-[#0B0F1A]">
        <Loader2 size={32} strokeWidth={1.75} className="animate-spin text-[#6366F1]" />
      </div>
    );
  }

  return (
    <div className="flex min-h-full">
      <Sidebar />
      <main className="flex-1 md:ml-[240px]">
        <div className="mx-auto max-w-[1200px] px-4 py-4 pb-24 md:px-6 md:py-6 md:pb-6">
          {children}
        </div>
      </main>
      <BottomNav />
    </div>
  );
}

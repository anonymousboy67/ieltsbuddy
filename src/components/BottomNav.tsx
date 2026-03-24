"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Calendar,
  Mic,
  BookOpen,
  Users,
} from "lucide-react";

const tabs = [
  { label: "Home", href: "/dashboard", icon: LayoutDashboard },
  { label: "Plan", href: "/dashboard/plan", icon: Calendar },
  { label: "Speaking", href: "/dashboard/speaking", icon: Mic },
  { label: "Reading", href: "/dashboard/reading", icon: BookOpen },
  { label: "Practice", href: "/dashboard/practice-room", icon: Users },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-stone-200 bg-[#F8F5F1] pb-[env(safe-area-inset-bottom)] md:hidden">
      <ul className="flex items-center justify-around px-2 py-2">
        {tabs.map((tab) => {
          const isActive =
            tab.href === "/dashboard"
              ? pathname === "/dashboard"
              : pathname.startsWith(tab.href);
          const Icon = tab.icon;

          return (
            <li key={tab.href}>
              <Link
                href={tab.href}
                className={`flex flex-col items-center gap-1 px-3 py-1 ${
                  isActive ? "text-emerald-700" : "text-stone-500"
                }`}
              >
                <Icon size={20} strokeWidth={1.75} />
                <span className="text-[11px] font-medium">{tab.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Calendar,
  Mic,
  BookOpen,
  PenLine,
  Headphones,
  Settings,
  User,
} from "lucide-react";

const navItems = [
  { label: "Home", href: "/dashboard", icon: LayoutDashboard },
  { label: "Study Plan", href: "/dashboard/plan", icon: Calendar },
  { label: "Speaking", href: "/dashboard/speaking", icon: Mic },
  { label: "Reading", href: "/dashboard/reading", icon: BookOpen },
  { label: "Writing", href: "/dashboard/writing", icon: PenLine },
  { label: "Listening", href: "/dashboard/listening", icon: Headphones },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex fixed left-0 top-0 h-full w-[240px] flex-col bg-[#12172B] border-r-[0.5px] border-[#2A3150] z-40">
      <div className="px-5 py-6">
        <Link href="/dashboard" className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-[#6366F1]" />
          <span className="font-heading text-xl font-bold text-[#F8FAFC]">
            IELTSBuddy
          </span>
        </Link>
      </div>

      <nav className="flex-1 px-3">
        <ul className="flex flex-col gap-1">
          {navItems.map((item) => {
            const isActive =
              item.href === "/dashboard"
                ? pathname === "/dashboard"
                : pathname.startsWith(item.href);
            const Icon = item.icon;

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`flex items-center gap-3 rounded-lg px-4 py-2.5 text-sm font-medium transition-all duration-150 ease-out ${
                    isActive
                      ? "bg-[rgba(99,102,241,0.1)] text-[#818CF8]"
                      : "text-[#94A3B8] hover:bg-[rgba(255,255,255,0.06)] hover:text-[#F8FAFC]"
                  }`}
                >
                  <Icon
                    size={20}
                    strokeWidth={1.75}
                    className={isActive ? "text-[#818CF8]" : ""}
                  />
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="border-t-[0.5px] border-[#2A3150] px-3 py-4">
        <Link
          href="/dashboard/settings"
          className={`flex items-center gap-3 rounded-lg px-4 py-2.5 text-sm font-medium transition-all duration-150 ease-out ${
            pathname === "/dashboard/settings"
              ? "bg-[rgba(99,102,241,0.1)] text-[#818CF8]"
              : "text-[#94A3B8] hover:bg-[rgba(255,255,255,0.06)] hover:text-[#F8FAFC]"
          }`}
        >
          <Settings size={20} strokeWidth={1.75} />
          Settings
        </Link>
        <div className="mt-3 flex items-center gap-3 px-4 py-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#1E2540]">
            <User size={16} strokeWidth={1.75} className="text-[#64748B]" />
          </div>
          <span className="text-sm font-medium text-[#94A3B8]">Student</span>
        </div>
      </div>
    </aside>
  );
}

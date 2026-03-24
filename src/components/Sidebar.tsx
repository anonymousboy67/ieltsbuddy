"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  LayoutDashboard,
  Calendar,
  Mic,
  BookOpen,
  PenLine,
  Headphones,
  Users,
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
  { label: "Practice Room", href: "/dashboard/practice-room", icon: Users },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const displayName = session?.user?.name || "Student";
  const displayEmail = session?.user?.email || "No email";
  const initials = displayName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "S";

  return (
    <aside className="fixed left-0 top-0 z-40 hidden h-full w-[240px] flex-col border-r border-stone-200 bg-[#F8F5F1] md:flex">
      <div className="px-5 py-6">
        <Link href="/dashboard" className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-emerald-700" />
          <span className="font-heading text-xl font-bold text-stone-800">
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
                  className={`flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium transition-all duration-150 ease-out ${
                    isActive
                      ? "bg-emerald-50 text-emerald-800"
                      : "text-stone-600 hover:bg-stone-100 hover:text-stone-800"
                  }`}
                >
                  <Icon
                    size={20}
                    strokeWidth={1.75}
                    className={isActive ? "text-emerald-700" : ""}
                  />
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="border-t border-stone-200 px-3 py-4">
        <Link
          href="/dashboard/settings"
          className={`flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium transition-all duration-150 ease-out ${
            pathname === "/dashboard/settings"
              ? "bg-emerald-50 text-emerald-800"
              : "text-stone-600 hover:bg-stone-100 hover:text-stone-800"
          }`}
        >
          <Settings size={20} strokeWidth={1.75} />
          Settings
        </Link>
        <div className="mt-3 flex items-center gap-3 px-4 py-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-stone-200 text-xs font-semibold text-stone-700">
            {session?.user?.image ? (
              <img
                src={session.user.image}
                alt={displayName}
                className="h-9 w-9 rounded-full object-cover"
              />
            ) : (
              initials
            )}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-stone-800">{displayName}</p>
            <p className="truncate text-xs text-stone-500">{displayEmail}</p>
          </div>
        </div>
      </div>
    </aside>
  );
}

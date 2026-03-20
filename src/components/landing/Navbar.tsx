"use client";

import Link from "next/link";
import { Menu, X } from "lucide-react";
import { useState } from "react";

const links = [
  { label: "Features", href: "#features" },
  { label: "Pricing", href: "#pricing" },
  { label: "About", href: "#how-it-works" },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b-[0.5px] border-[rgba(255,255,255,0.06)] bg-[#0B0F1A]/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-[1200px] items-center justify-between px-4 py-3 md:px-6">
        <Link href="/" className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-[#6366F1]" />
          <span className="font-heading text-lg font-bold text-[#F8FAFC]">
            IELTSBuddy
          </span>
        </Link>

        <div className="hidden items-center gap-8 md:flex">
          {links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-sm text-[#94A3B8] transition-colors duration-150 hover:text-white"
            >
              {link.label}
            </a>
          ))}
          <Link
            href="/onboarding"
            className="rounded-lg bg-[#6366F1] px-5 py-2 text-sm font-medium text-white transition-colors duration-200 hover:bg-[#818CF8]"
          >
            Get Started
          </Link>
        </div>

        <div className="flex items-center gap-3 md:hidden">
          <Link
            href="/onboarding"
            className="rounded-lg bg-[#6366F1] px-4 py-2 text-sm font-medium text-white transition-colors duration-200 hover:bg-[#818CF8]"
          >
            Get Started
          </Link>
          <button
            onClick={() => setOpen(!open)}
            className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-lg text-[#94A3B8]"
            aria-label="Toggle menu"
          >
            {open ? <X size={22} strokeWidth={1.75} /> : <Menu size={22} strokeWidth={1.75} />}
          </button>
        </div>
      </div>

      {open && (
        <div className="border-t-[0.5px] border-[rgba(255,255,255,0.06)] bg-[#0B0F1A] px-4 pb-4 md:hidden">
          {links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              className="block py-3 text-sm text-[#94A3B8] transition-colors hover:text-white"
            >
              {link.label}
            </a>
          ))}
        </div>
      )}
    </nav>
  );
}

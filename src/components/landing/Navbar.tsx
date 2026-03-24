"use client";

import Link from "next/link";
import { Menu, X } from "lucide-react";
import { useState } from "react";
import { useAuthModal } from "@/context/AuthModalContext";

const links = [
  { label: "Features", href: "#features" },
  { label: "Pricing", href: "#pricing" },
  { label: "About", href: "#how-it-works" },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const { openModal } = useAuthModal();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-stone-200 bg-[#FCFAF8]/90 backdrop-blur-xl">
      <div className="mx-auto flex max-w-[1200px] items-center justify-between px-4 py-3 md:px-6">
        <Link href="/" className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-emerald-700" />
          <span className="font-heading text-lg font-bold text-stone-800">
            IELTSBuddy
          </span>
        </Link>

        <div className="hidden items-center gap-8 md:flex">
          {links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-sm text-stone-600 transition-colors duration-150 hover:text-stone-800"
            >
              {link.label}
            </a>
          ))}
          <button
            onClick={() => openModal("login")}
            className="text-sm font-medium text-stone-600 transition-colors duration-150 hover:text-stone-800"
          >
            Login
          </button>
          <button
            onClick={() => openModal("signup")}
            className="rounded-xl bg-emerald-700 px-5 py-2 text-sm font-semibold text-white transition-colors duration-200 hover:bg-teal-700"
          >
            Register
          </button>
        </div>

        <div className="flex items-center gap-3 md:hidden">
          <button
            onClick={() => openModal("signup")}
            className="rounded-xl bg-emerald-700 px-4 py-2 text-sm font-semibold text-white transition-colors duration-200 hover:bg-teal-700"
          >
            Register
          </button>
          <button
            onClick={() => setOpen(!open)}
            className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-lg text-stone-600"
            aria-label="Toggle menu"
          >
            {open ? <X size={22} strokeWidth={1.75} /> : <Menu size={22} strokeWidth={1.75} />}
          </button>
        </div>
      </div>

      {open && (
        <div className="border-t border-stone-200 bg-[#FCFAF8] px-4 pb-4 md:hidden">
          {links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              className="block py-3 text-sm text-stone-600 transition-colors hover:text-stone-800"
            >
              {link.label}
            </a>
          ))}
        </div>
      )}
    </nav>
  );
}

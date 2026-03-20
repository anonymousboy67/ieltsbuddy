import Link from "next/link";

const navLinks = [
  { label: "Features", href: "#features" },
  { label: "Pricing", href: "#pricing" },
  { label: "About", href: "#how-it-works" },
  { label: "Contact", href: "#" },
];

const legalLinks = [
  { label: "Privacy Policy", href: "#" },
  { label: "Terms of Service", href: "#" },
];

export default function Footer() {
  return (
    <footer className="border-t-[0.5px] border-[#2A3150] bg-[#0B0F1A] px-4 py-12 md:px-6">
      <div className="mx-auto grid max-w-[1200px] gap-10 md:grid-cols-3">
        <div>
          <Link href="/" className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-[#6366F1]" />
            <span className="font-heading text-lg font-bold text-[#F8FAFC]">
              IELTSBuddy
            </span>
          </Link>
          <p className="mt-3 max-w-xs text-sm text-[#64748B]">
            AI-powered IELTS preparation platform designed for Nepali students.
          </p>
        </div>

        <div>
          <h4 className="text-sm font-medium text-[#F8FAFC]">Links</h4>
          <ul className="mt-3 flex flex-col gap-2">
            {navLinks.map((link) => (
              <li key={link.label}>
                <a
                  href={link.href}
                  className="text-sm text-[#64748B] transition-colors hover:text-[#94A3B8]"
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h4 className="text-sm font-medium text-[#F8FAFC]">Legal</h4>
          <ul className="mt-3 flex flex-col gap-2">
            {legalLinks.map((link) => (
              <li key={link.label}>
                <a
                  href={link.href}
                  className="text-sm text-[#64748B] transition-colors hover:text-[#94A3B8]"
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <p className="mt-10 text-center text-[13px] text-[#64748B]">
        Built for Nepali IELTS aspirants
      </p>
    </footer>
  );
}

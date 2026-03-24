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
    <footer className="border-t border-stone-200 bg-[#F8F5F1] px-4 py-12 md:px-6">
      <div className="mx-auto grid max-w-[1200px] gap-10 md:grid-cols-3">
        <div>
          <Link href="/" className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-700" />
            <span className="font-heading text-lg font-bold text-stone-800">
              IELTSBuddy
            </span>
          </Link>
          <p className="mt-3 max-w-xs text-sm text-stone-500">
            AI-powered IELTS preparation platform designed for Nepali students.
          </p>
        </div>

        <div>
          <h4 className="text-sm font-medium text-stone-800">Links</h4>
          <ul className="mt-3 flex flex-col gap-2">
            {navLinks.map((link) => (
              <li key={link.label}>
                <a
                  href={link.href}
                  className="text-sm text-stone-500 transition-colors hover:text-stone-700"
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h4 className="text-sm font-medium text-stone-800">Legal</h4>
          <ul className="mt-3 flex flex-col gap-2">
            {legalLinks.map((link) => (
              <li key={link.label}>
                <a
                  href={link.href}
                  className="text-sm text-stone-500 transition-colors hover:text-stone-700"
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <p className="mt-10 text-center text-[13px] text-stone-500">
        Built for Nepali IELTS aspirants
      </p>
    </footer>
  );
}

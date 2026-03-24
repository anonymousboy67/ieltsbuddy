import { Suspense } from "react";
import Navbar from "@/components/landing/Navbar";
import Hero from "@/components/landing/Hero";
import Features from "@/components/landing/Features";
import HowItWorks from "@/components/landing/HowItWorks";
import Pricing from "@/components/landing/Pricing";
import Footer from "@/components/landing/Footer";
import AuthModalAutoOpen from "@/components/auth/AuthModalAutoOpen";

export default function Home() {
  return (
    <div className="bg-stone-50 text-stone-600">
      <Suspense fallback={null}>
        <AuthModalAutoOpen />
      </Suspense>
      <Navbar />
      <Hero />
      <Features />
      <HowItWorks />
      <Pricing />
      <Footer />
    </div>
  );
}

"use client";

import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import HowItWorks from "@/components/HowItWorks";
import PacingPlans from "@/components/PacingPlans";
import IntakePreview from "@/components/IntakePreview";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col font-sans bg-white text-slate-900 selection:bg-slate-900/10 selection:text-slate-900">
      {/* Header/Navbar */}
      <Navbar />

      {/* Hero Section (Uses iop.jpg for background with overlay, white text on top) */}
      <Hero />

      {/* Main Content Areas with White Background below Hero */}
      <main className="relative z-10 bg-white">
        {/* How It Works Section */}
        <HowItWorks />

        {/* Specialized Pacing Plans */}
        <PacingPlans />

        {/* AI Companion Section / Preview */}
        <IntakePreview />
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}

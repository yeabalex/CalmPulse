"use client";

import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import HowItWorks from "@/components/HowItWorks";
import PacingPlans from "@/components/PacingPlans";
import IntakePreview from "@/components/IntakePreview";
import Footer from "@/components/Footer";
import { useAuth } from "@/lib/useAuth";
import { useState, useEffect } from "react";
import { Sparkles, X, ArrowRight } from "lucide-react";

export default function Home() {
  // Redirect logged-in users directly to dashboard
  useAuth({ redirectTo: "/dashboard", redirectIfFound: true });

  const [showDemoWidget, setShowDemoWidget] = useState(false);

  useEffect(() => {
    // Show after a short delay
    const timer = setTimeout(() => {
      setShowDemoWidget(true);
    }, 800);
    return () => clearTimeout(timer);
  }, []);

  const launchDemo = () => {
    localStorage.setItem("calmpulse_demo", "true");
    window.location.href = "/dashboard";
  };

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

      {/* Floating Demo Sandbox Widget */}
      {showDemoWidget && (
        <div className="fixed bottom-6 left-6 right-6 md:left-auto md:right-6 md:max-w-sm z-50 bg-white/95 backdrop-blur-md border border-slate-205 shadow-2xl p-5 rounded-3xl animate-fade-in flex flex-col gap-3">
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-2 text-violet-600 font-bold text-xs uppercase tracking-wider">
              <Sparkles className="w-4 h-4 animate-pulse" />
              Reviewer Sandbox Mode
            </div>
            <button 
              onClick={() => setShowDemoWidget(false)}
              className="text-slate-400 hover:text-slate-600 transition-colors p-1 hover:bg-slate-100 rounded-lg cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-900">Try CalmPulse in 1-Click</h4>
            <p className="text-[10px] text-slate-500 mt-1 leading-relaxed">
              Explore the full interactive dashboard, pacing checklist, AI companion chat, and daily reflections offline with zero database or API setup.
            </p>
          </div>
          <button
            onClick={launchDemo}
            className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-md shadow-slate-900/10 cursor-pointer"
          >
            Launch Demo Sandbox
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}

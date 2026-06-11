"use client";

import Link from "next/link";
import { ArrowRight, Zap, Shield, Sparkles } from "lucide-react";
import GlassCard from "@/components/shared/GlassCard";
import TensionDial from "@/components/shared/vitals/TensionDial";
import HeartRateWidget from "@/components/shared/vitals/HeartRateWidget";
import CohortInfoWidget from "@/components/shared/vitals/CohortInfoWidget";

export default function Hero() {
  return (
    <section 
      className="relative pt-32 pb-24 md:pt-40 md:pb-36 px-6 md:px-12 w-full flex items-center min-h-[90vh] overflow-hidden bg-slate-50"
      style={{
        backgroundImage: "url('/iop.jpg')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat"
      }}
    >
      <div className="max-w-7xl mx-auto w-full flex flex-col lg:flex-row items-center gap-16 relative z-10">
        
        {/* Left Side: Hero Content */}
        <div className="flex-1 text-center lg:text-left space-y-6 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900/10 border border-slate-900/20 text-xs font-bold text-slate-900 backdrop-blur-sm">
            <Zap className="w-3.5 h-3.5 text-slate-900" />
            AI-Powered Stress Companion
          </div>
          
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-slate-900 leading-[1.12]">
            Your Mental <br />
            <span className="font-display italic text-slate-700 font-medium">
              Health Matters
            </span>
          </h1>
          <p className="text-base text-slate-850 max-w-lg leading-relaxed mx-auto lg:mx-0 font-semibold bg-white/20 p-4.5 rounded-2xl backdrop-blur-sm border border-white/30">
            A non-clinical lifestyle pacing companion, you pace alongside your 1-on-1 AI coach to safely reduce anxiety levels and build good habits.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-4">
            <Link
              href="/intake"
              className="w-full sm:w-auto px-8 py-4 rounded-full bg-slate-900 text-white font-bold hover:bg-slate-800 transition-all duration-300 flex items-center justify-center gap-2 hover:scale-[1.02] shadow-lg shadow-slate-900/10"
            >
              Start Free Assessment
              <ArrowRight className="w-4 h-4" />
            </Link>
            <button
              onClick={() => {
                localStorage.setItem("calmpulse_demo", "true");
                window.location.href = "/dashboard";
              }}
              className="w-full sm:w-auto px-8 py-4 rounded-full bg-gradient-to-r from-violet-600 to-indigo-650 text-white font-bold hover:from-violet-700 hover:to-indigo-700 transition-all duration-300 flex items-center justify-center gap-2 hover:scale-[1.02] shadow-lg shadow-indigo-600/20 cursor-pointer"
            >
              <Sparkles className="w-4 h-4 animate-pulse" />
              Reviewer Sandbox
            </button>
            <Link
              href="#how-it-works"
              className="w-full sm:w-auto px-8 py-4 rounded-full border border-slate-900/30 font-bold text-slate-900 hover:bg-slate-900/5 transition-all duration-300 flex items-center justify-center"
            >
              Learn the Science
            </Link>
          </div>
        </div>

        {/* Right Side: Reusable telemetry cards floating organically over background */}
        <div className="flex-1 w-full max-w-md lg:max-w-none flex justify-center items-center relative min-h-[400px]">
          
          {/* Main Dashboard Panel */}
          <GlassCard className="w-full max-w-sm relative z-10 flex flex-col gap-6" animation="float">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs font-bold text-slate-900 tracking-wide uppercase">Pacing Baseline</span>
              </div>
              <span className="text-[10px] font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-full">
                Active
              </span>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-slate-500 uppercase block">Recommended Rest Pace</span>
                <span className="text-2xl font-black text-slate-900 mt-1 block">45% <span className="text-xs font-medium text-slate-600">Slower Pace</span></span>
              </div>
              <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-900">
                <Zap className="w-5 h-5 text-slate-800 fill-slate-900/10" />
              </div>
            </div>

            <div className="space-y-2.5">
              <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">Pacing Adjustments</span>
              <div className="space-y-2">
                <div className="bg-slate-50 border border-slate-200/50 rounded-xl p-3 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-2 h-2 rounded-full bg-amber-500" />
                    <span className="text-xs font-semibold text-slate-800">Screen Boundary (9:30 PM)</span>
                  </div>
                  <span className="text-[10px] text-slate-500 font-medium">Calibrated</span>
                </div>
                <div className="bg-slate-50 border border-slate-200/50 rounded-xl p-3 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-2 h-2 rounded-full bg-cyan-500" />
                    <span className="text-xs font-semibold text-slate-800">Breathing Break (4m Interval)</span>
                  </div>
                  <span className="text-[10px] text-slate-500 font-medium">Triggered</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 text-[11px] text-slate-750 bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3">
              <Shield className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>AI tracking active: your stress levels are dropping.</span>
            </div>
          </GlassCard>

          {/* Floating Widget 1: Reusable Tension score */}
          <GlassCard className="absolute top-0 -left-6 md:-left-12 shadow-xl p-4 w-36 z-20" animation="float-slow">
            <TensionDial score={6.8} size="sm" />
          </GlassCard>

          {/* Floating Widget 2: Reusable HRV tracker */}
          <GlassCard className="absolute bottom-6 -right-6 md:-right-10 shadow-xl p-4 z-20" animation="float-fast">
            <HeartRateWidget bpm={95} />
          </GlassCard>

          {/* Floating Widget 3: Reusable Cohort details */}
          <GlassCard className="absolute -bottom-8 left-6 right-6 shadow-xl p-3.5 z-20" animation="float">
            <CohortInfoWidget podId={42} activeCount={5} totalCount={8} />
          </GlassCard>

        </div>

      </div>
    </section>
  );
}

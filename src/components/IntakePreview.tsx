"use client";

import Link from "next/link";
import { ArrowRight, CheckCircle2, Sparkles } from "lucide-react";

export default function IntakePreview() {
  const features = [
    "Conversational diagnostics replace rigid multi-choice forms",
    "Closed-loop feedback adjusts habits as your logs fluctuate",
    "Structured output parses exact behavioral metrics from natural text"
  ];

  return (
    <section id="companion" className="py-24 px-6 md:px-12 max-w-7xl mx-auto w-full border-t border-slate-100">
      <div className="flex flex-col lg:flex-row items-center gap-16">
        
        {/* Left Side: Content & Features */}
        <div className="flex-1 space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-xs font-bold text-slate-800">
            <Sparkles className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
            Conversational Intake Companion
          </div>
          
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 font-display">
            Meet Your AI Mental <br />Health Companion
          </h2>
          
          <p className="text-slate-650 leading-relaxed text-sm">
            Say goodbye to cold checklists. CalmPulse parses natural, open-ended venting to identify somatic triggers, automatically constructing and updating your adaptive habits.
          </p>
          
          <div className="space-y-3">
            {features.map((bullet, index) => (
              <div key={index} className="flex items-center gap-3">
                <CheckCircle2 className="w-4.5 h-4.5 text-slate-900 shrink-0" />
                <span className="text-sm text-slate-800 font-medium">
                  {bullet}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Right Side: Mock Chat Interface */}
        <div className="flex-1 w-full max-w-xl">
          <div className="glass-panel rounded-3xl p-6 border border-slate-200 shadow-xl space-y-6">
            
            <div className="flex justify-between items-center border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-2.5 h-2.5 rounded-full bg-slate-900" />
                <span className="text-xs font-bold text-slate-800">Adaptive Profiling Engine</span>
              </div>
              <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-md">
                Gemini Model
              </span>
            </div>

            {/* Chat Bubbles */}
            <div className="space-y-4 text-xs">
              <div className="space-y-1">
                <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">
                  Selected Focus Area
                </div>
                <div className="bg-slate-100 text-slate-800 border border-slate-200/50 px-3.5 py-1.5 rounded-full inline-block font-semibold">
                  Generalized Social Anxiety
                </div>
              </div>

              <div className="space-y-1">
                <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">
                  Your Vent
                </div>
                <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl rounded-tl-none text-slate-700 leading-relaxed shadow-sm">
                  &quot;I have this presentation tomorrow. My heart feels like it&apos;s racing whenever I look at the slides, and I&apos;m starting to get dizzy just thinking about standing in front of the group.&quot;
                </div>
              </div>

              <div className="space-y-1">
                <div className="text-[9px] font-bold text-slate-900 uppercase tracking-wide flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-amber-500 animate-pulse" />
                  AI Clarifying Query
                </div>
                <div className="bg-slate-900 text-white p-4 rounded-2xl rounded-tr-none shadow-md space-y-2 leading-relaxed">
                  <p className="font-bold text-slate-100">To calibrate your baseline, let&apos;s understand:</p>
                  <ul className="list-disc list-inside space-y-1 text-slate-300">
                    <li>Does the racing heart spike more while preparing slides, or when rehearsing the presentation?</li>
                    <li>Are you experiencing tension in your jaw or shoulders right now?</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* CTA to Assessment */}
            <Link
              href="/intake"
              className="w-full py-4 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl flex items-center justify-center gap-2 font-bold transition-all duration-300 text-xs shadow-md shadow-slate-900/10"
            >
              Experience Conversational Intake
              <ArrowRight className="w-4 h-4" />
            </Link>

          </div>
        </div>

      </div>
    </section>
  );
}

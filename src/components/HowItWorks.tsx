"use client";

import { MessageSquare, Compass, Sparkles, Activity } from "lucide-react";

export default function HowItWorks() {
  const steps = [
    {
      step: "01",
      title: "Venting & Chat Assessment",
      desc: "Instead of clicking cold multiple-choice forms, simply write or voice-vent how you feel. Our AI companion parses natural language to analyze your current anxiety level.",
      icon: MessageSquare,
    },
    {
      step: "02",
      title: "Personalized Support Habits",
      desc: "CalmPulse synthesizes a dynamic list of custom pacing adjustments (screen limits, cognitive pauses, breathing alerts) tailored to your exact emotional metrics.",
      icon: Compass,
    },
    {
      step: "03",
      title: "AI Pacing Companion",
      desc: "Receive real-time support from your 1-on-1 AI pacing companion. Get personalized advice on habits, trigger management, stress patterns, and somatic pauses.",
      icon: Sparkles,
    },
    {
      step: "04",
      title: "Continuous Recalibration",
      desc: "Log daily reflections. As your emotional tracking logs improve or fluctuate, our feedback engine recalibrates your pace goals and updates your pacing baseline trends.",
      icon: Activity,
    },
  ];

  return (
    <section id="how-it-works" className="py-24 px-6 md:px-12 max-w-7xl mx-auto w-full">
      <div className="text-center max-w-2xl mx-auto space-y-3 mb-16">
        <h2 className="text-3xl md:text-4xl font-bold text-slate-900 font-display">
          How It Works
        </h2>
        <p className="text-slate-650 text-sm max-w-lg mx-auto">
          An AI-driven closed-loop workflow that continuously refines your pacing guidelines and assists your stress-resilience recovery.
        </p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
        {steps.map((item, idx) => (
          <div
            key={idx}
            className="glass-panel hover-lift rounded-[24px] p-8 relative group border border-slate-200/50 cursor-default"
          >
            <div className="w-12 h-12 rounded-xl bg-slate-900 text-white flex items-center justify-center mb-6">
              <item.icon className="w-6 h-6" />
            </div>
            
            <div className="absolute top-6 right-8 text-3xl font-extrabold text-slate-200/80 group-hover:text-slate-300 transition-colors">
              {item.step}
            </div>
            
            <h3 className="text-lg font-bold text-slate-900 mb-2">
              {item.title}
            </h3>
            
            <p className="text-sm text-slate-600 leading-relaxed">
              {item.desc}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

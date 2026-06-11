"use client";

import { MessageSquare, Compass, Sparkles, Activity } from "lucide-react";

export default function HowItWorks() {
  const steps = [
    {
      step: "01",
      title: "Write How You Feel",
      desc: "Instead of clicking cold multiple-choice surveys, just write or speak how your day went. Our AI companion reviews your text to understand your current stress level.",
      icon: MessageSquare,
    },
    {
      step: "02",
      title: "Get Your Daily Pacing Plan",
      desc: "CalmPulse gives you a customized checklist of healthy pacing habits (like screen boundaries, quick breathing breaks, or outdoor strolls) tailored to your needs.",
      icon: Compass,
    },
    {
      step: "03",
      title: "1-on-1 AI Coaching",
      desc: "Get real-time feedback and encouragement from your AI pacing companion. Ask questions about your habits, stress triggers, or daily schedule any time.",
      icon: Sparkles,
    },
    {
      step: "04",
      title: "Recalibrate & Track Progress",
      desc: "As you check off habits and write down reflections, the app updates your stress baseline, logs your journal entries, and tracks your mental wellness trends.",
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
          A simple daily loop: write down how you feel, get your custom habit plan, chat with your AI pacing coach, and watch your stress baseline recalibrate.
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

"use client";

import { Heart, MessageSquare, Sparkles } from "lucide-react";

interface SubtypeSelectionProps {
  onSelect: (subtype: string) => void;
}

export default function SubtypeSelection({ onSelect }: SubtypeSelectionProps) {
  const subtypes = [
    {
      title: "Social & Performance Anxiety",
      desc: "Anticipation stress, racing heart before presentations or social events, and frequent post-event rumination.",
      icon: MessageSquare,
      accent: "bg-blue-50 border-blue-200 text-blue-700"
    },
    {
      title: "Generalized Tension",
      desc: "Frequent physical restlessness, faster breathing, muscle tension (jaw/shoulders), and sudden stress waves.",
      icon: Heart,
      accent: "bg-teal-50 border-teal-200 text-teal-700"
    },
    {
      title: "Burnout & Attention Fatigue",
      desc: "Screen aversion, heavy mental fatigue from prolonged focus, difficult work-rest transitions, and disrupted sleep habits.",
      icon: Sparkles,
      accent: "bg-amber-50 border-amber-200 text-amber-700"
    }
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="space-y-3 text-center sm:text-left">
        <h2 className="text-2xl md:text-3xl font-bold text-slate-900 font-display">
          What area of focus fits your experience?
        </h2>
        <p className="text-sm text-slate-605 max-w-xl">
          Select the focus area that feels closest to your current struggles. We will customize your pacing schedule accordingly.
        </p>
      </div>

      <div className="grid sm:grid-cols-3 gap-6">
        {subtypes.map((sub, idx) => (
          <button
            key={idx}
            onClick={() => onSelect(sub.title)}
            className="text-left glass-panel border border-slate-200 hover-lift rounded-2xl p-6 flex flex-col justify-between h-64 group cursor-pointer"
          >
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${sub.accent}`}>
              <sub.icon className="w-6 h-6" />
            </div>
            
            <div className="space-y-2 mt-4">
              <h3 className="text-base font-bold text-slate-900 group-hover:text-slate-950 transition-colors">
                {sub.title}
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                {sub.desc}
              </p>
            </div>

            <div className="mt-4 flex items-center text-xs font-bold text-slate-700 group-hover:text-slate-900 gap-1.5 pt-2 border-t border-slate-100">
              Select Focus
              <span className="group-hover:translate-x-1 transition-transform">→</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

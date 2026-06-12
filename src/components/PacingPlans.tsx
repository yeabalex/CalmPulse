"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";

export default function PacingPlans() {
  const plans = [
    {
      title: "Social & Performance Anxiety",
      desc: "Built for pre-event stress. Uses audio guidance, caffeine boundaries before meetings, and short reflection habits after hard moments.",
      metricName: "Focus Area",
      metricValue: "Social Stress"
    },
    {
      title: "Generalized Tension",
      desc: "Designed for body tension and sudden stress waves. Uses grounding reminders, calm-space tools, and breathing breaks.",
      metricName: "Support Style",
      metricValue: "Body Calm"
    },
    {
      title: "Burnout & Attention Fatigue",
      desc: "Optimized for high-burnout environments. Focuses on timed digital boundaries, cognitive cooldown periods, daily screen detox blocks, and energy pacing logs.",
      metricName: "Attention Model",
      metricValue: "Cognitive Load Recovery"
    }
  ];

  return (
    <section id="services" className="py-24 px-6 md:px-12 max-w-7xl mx-auto w-full border-t border-slate-100">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end mb-16 gap-6">
        <div className="space-y-3">
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 font-display">
            Specialized Pacing Plans
          </h2>
          <p className="text-slate-650 max-w-md text-sm">
            Gentle pacing plans shaped around different stress patterns.
          </p>
        </div>
        <Link
          href="/intake"
          className="group inline-flex items-center gap-2 px-6 py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-full transition-all duration-300 text-xs shadow-md shadow-slate-900/10"
        >
          Find Your Focus
          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        {plans.map((srv, idx) => (
          <div
            key={idx}
            className="glass-panel hover-lift rounded-3xl p-8 flex flex-col justify-between h-[300px] cursor-default"
          >
            <div>
              <h3 className="text-xl font-bold text-slate-900 font-display mb-4">
                {srv.title}
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                {srv.desc}
              </p>
            </div>
            
            <div className="mt-8 flex items-center justify-between border-t border-slate-100 pt-4">
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                {srv.metricName}
              </span>
              <span className="text-xs font-semibold text-slate-700">
                {srv.metricValue}
              </span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

"use client";

import { useState } from "react";
import { Compass, Shield, Target, Flame, Brain, Moon, Sparkles } from "lucide-react";
import GlassCard from "@/components/shared/GlassCard";

export interface WellnessGoal {
  id: string;
  title: string;
  duration: number;
  description: string;
  iconType: "anxiety" | "focus" | "stress" | "sleep";
  colorClass: string;
}

interface GoalSelectionProps {
  onSubmit: (goal: WellnessGoal) => void;
  onBack?: () => void;
}

export default function GoalSelection({ onSubmit, onBack }: GoalSelectionProps) {
  const [selectedId, setSelectedId] = useState("g1");

  const goals: WellnessGoal[] = [
    {
      id: "g1",
      title: "Reduce Anxiety in 90 Days",
      duration: 90,
      description: "Graduate somatic deceleration, build pre-event buffers, and establish active cognitive grounding checkpoints.",
      iconType: "anxiety",
      colorClass: "from-rose-500 to-amber-500"
    },
    {
      id: "g2",
      title: "Improve Focus in 60 Days",
      duration: 60,
      description: "Counter screen attention fatigue, structure 50-10 work cycles, and implement physical re-activation routines.",
      iconType: "focus",
      colorClass: "from-blue-500 to-indigo-500"
    },
    {
      id: "g3",
      title: "Reduce Stress Levels in 45 Days",
      duration: 45,
      description: "Integrate rapid somatic vagal tone pacing, structure workflow load intervals, and establish offline boundaries.",
      iconType: "stress",
      colorClass: "from-cyan-500 to-emerald-500"
    },
    {
      id: "g4",
      title: "Improve Sleep Quality in 30 Days",
      duration: 30,
      description: "Calibrate pre-sleep screen detach boundaries, establish wind-down rituals, and sync morning intentions.",
      iconType: "sleep",
      colorClass: "from-violet-500 to-fuchsia-500"
    }
  ];

  const handleSelect = (id: string) => {
    setSelectedId(id);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const goal = goals.find((g) => g.id === selectedId);
    if (goal) onSubmit(goal);
  };

  return (
    <div className="space-y-8 animate-fade-in max-w-3xl mx-auto w-full">
      <div className="space-y-3 text-center">
        <div className="inline-flex items-center gap-1 bg-slate-900/5 px-3 py-1 rounded-full text-xs font-bold text-slate-800">
          <Sparkles className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
          Onboarding Blueprint
        </div>
        <h2 className="text-2xl md:text-3xl font-bold text-slate-900 font-display">
          Establish Your Wellness Goal
        </h2>
        <p className="text-xs text-slate-505 max-w-md mx-auto">
          Choose a clinical pacing focus area. Based on this goal, our AI will generate a personalized daily pacing plan and track your progress metrics.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="grid md:grid-cols-2 gap-5">
          {goals.map((goal) => (
            <div
              key={goal.id}
              onClick={() => handleSelect(goal.id)}
              className={`group cursor-pointer transition-all duration-300 transform ${
                selectedId === goal.id ? "scale-[1.02]" : "hover:scale-[1.01]"
              }`}
            >
              <GlassCard
                className={`p-6 border rounded-2xl h-full flex flex-col justify-between transition-all ${
                  selectedId === goal.id
                    ? "border-slate-800 bg-white ring-1 ring-slate-800 shadow-md"
                    : "border-slate-200 bg-white/60 hover:bg-white/80"
                }`}
              >
                <div className="space-y-4">
                  {/* Top Bar with Icon & Duration */}
                  <div className="flex justify-between items-center">
                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-white bg-gradient-to-br ${goal.colorClass} shadow-md`}>
                      {goal.iconType === "anxiety" && <Target className="w-5.5 h-5.5" />}
                      {goal.iconType === "focus" && <Brain className="w-5.5 h-5.5" />}
                      {goal.iconType === "stress" && <Flame className="w-5.5 h-5.5" />}
                      {goal.iconType === "sleep" && <Moon className="w-5.5 h-5.5" />}
                    </div>
                    <span className="text-[10px] font-extrabold px-2.5 py-1 rounded-full bg-slate-100 text-slate-800 border border-slate-200">
                      {goal.duration} DAYS
                    </span>
                  </div>

                  {/* Title & Description */}
                  <div className="space-y-2">
                    <h3 className="text-sm font-bold text-slate-900 leading-tight">
                      {goal.title}
                    </h3>
                    <p className="text-[11px] text-slate-500 leading-relaxed">
                      {goal.description}
                    </p>
                  </div>
                </div>

                {/* Selected Indicator Checkbox */}
                <div className="flex justify-end pt-4 border-t border-slate-100/50 mt-4">
                  <div className={`w-4 h-4 rounded-full border flex items-center justify-center transition-all ${
                    selectedId === goal.id
                      ? "border-slate-800 bg-slate-900 text-white"
                      : "border-slate-350 bg-transparent"
                  }`}>
                    {selectedId === goal.id && (
                      <div className="w-1.5 h-1.5 rounded-full bg-white" />
                    )}
                  </div>
                </div>
              </GlassCard>
            </div>
          ))}
        </div>

        <div className="flex justify-between items-center pt-4 border-t border-slate-200/65">
          {onBack ? (
            <button
              type="button"
              onClick={onBack}
              className="px-6 py-3.5 rounded-xl border border-slate-200 font-bold text-slate-700 hover:bg-slate-50 transition-all text-xs cursor-pointer"
            >
              Back
            </button>
          ) : (
            <div />
          )}

          <button
            type="submit"
            className="px-8 py-3.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-xs shadow-md shadow-slate-900/10 cursor-pointer"
          >
            Confirm Goal & Pacing Plan
          </button>
        </div>
      </form>
    </div>
  );
}

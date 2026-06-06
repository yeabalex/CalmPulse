"use client";

import { useState } from "react";
import { Zap, Clock, ToggleLeft, ToggleRight } from "lucide-react";

interface PacingHabit {
  id: string;
  name: string;
  type: string;
  value: string;
  enabled: boolean;
}

interface PacingPlanSetupProps {
  onSubmit: (habits: PacingHabit[]) => void;
}

export default function PacingPlanSetup({ onSubmit }: PacingPlanSetupProps) {
  const [habits, setHabits] = useState<PacingHabit[]>([
    {
      id: "h1",
      name: "Digital Screen Detach",
      type: "Digital",
      value: "21:30",
      enabled: true
    },
    {
      id: "h2",
      name: "Somatic Breathing Pause",
      type: "Somatic",
      value: "3", // hours
      enabled: true
    },
    {
      id: "h3",
      name: "Caffeine restriction pre-stressor",
      type: "Dietary",
      value: "4", // hours prior
      enabled: true
    }
  ]);

  const handleToggle = (id: string) => {
    setHabits((prev) =>
      prev.map((h) => (h.id === id ? { ...h, enabled: !h.enabled } : h))
    );
  };

  const handleValueChange = (id: string, value: string) => {
    setHabits((prev) =>
      prev.map((h) => (h.id === id ? { ...h, value } : h))
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(habits);
  };

  return (
    <div className="space-y-8 animate-fade-in max-w-2xl mx-auto">
      <div className="space-y-3 text-center">
        <h2 className="text-2xl md:text-3xl font-bold text-slate-900 font-display">
          Customize Your Pacing Reminders
        </h2>
        <p className="text-xs text-slate-500 max-w-md mx-auto">
          We have generated your custom pacing baseline parameters. Feel free to tweak these trigger times and intervals to fit your schedule.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-4">
          {habits.map((habit) => (
            <div
              key={habit.id}
              className={`glass-panel border rounded-2xl p-6 transition-all bg-white flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 ${
                habit.enabled ? "border-slate-300" : "border-slate-200 opacity-60"
              }`}
            >
              <div className="space-y-1.5 flex-1">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-full bg-slate-900/5 text-slate-905 font-bold uppercase tracking-wider text-[8px]">
                    {habit.type}
                  </span>
                  <h3 className="text-sm font-bold text-slate-900">{habit.name}</h3>
                </div>
                <p className="text-xs text-slate-500">
                  {habit.id === "h1" && "Helps decelerate cognitive arousal before sleep."}
                  {habit.id === "h2" && "Vagus nerve stimulation to reduce somatic tension."}
                  {habit.id === "h3" && "Controls biological adrenaline build-up."}
                </p>
              </div>

              <div className="flex items-center gap-4 w-full sm:w-auto shrink-0 justify-between sm:justify-end border-t sm:border-t-0 pt-4 sm:pt-0">
                {habit.enabled && (
                  <div className="flex items-center gap-2">
                    {habit.id === "h1" ? (
                      <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl text-xs">
                        <Clock className="w-3.5 h-3.5 text-slate-500" />
                        <input
                          type="time"
                          value={habit.value}
                          onChange={(e) => handleValueChange(habit.id, e.target.value)}
                          className="bg-transparent border-0 p-0 text-xs font-bold text-slate-800 focus:ring-0 focus:outline-none w-14"
                        />
                      </div>
                    ) : habit.id === "h2" ? (
                      <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl text-xs">
                        <span className="text-[10px] text-slate-400 font-bold">INTERVAL:</span>
                        <select
                          value={habit.value}
                          onChange={(e) => handleValueChange(habit.id, e.target.value)}
                          className="bg-transparent border-0 p-0 text-xs font-bold text-slate-800 focus:ring-0 focus:outline-none"
                        >
                          <option value="2">Every 2 hours</option>
                          <option value="3">Every 3 hours</option>
                          <option value="4">Every 4 hours</option>
                        </select>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl text-xs">
                        <span className="text-[10px] text-slate-400 font-bold">BUFFER:</span>
                        <select
                          value={habit.value}
                          onChange={(e) => handleValueChange(habit.id, e.target.value)}
                          className="bg-transparent border-0 p-0 text-xs font-bold text-slate-800 focus:ring-0 focus:outline-none"
                        >
                          <option value="2">2 hrs prior</option>
                          <option value="3">3 hrs prior</option>
                          <option value="4">4 hrs prior</option>
                        </select>
                      </div>
                    )}
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => handleToggle(habit.id)}
                  className="text-slate-700 hover:text-slate-905 transition-colors cursor-pointer"
                >
                  {habit.enabled ? (
                    <ToggleRight className="w-9 h-9 text-slate-900" />
                  ) : (
                    <ToggleLeft className="w-9 h-9 text-slate-300" />
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-end pt-4">
          <button
            type="submit"
            className="px-8 py-3.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-xs shadow-md shadow-slate-900/10 cursor-pointer"
          >
            Confirm & Continue
          </button>
        </div>
      </form>
    </div>
  );
}

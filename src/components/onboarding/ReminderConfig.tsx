"use client";

import { useState } from "react";
import { Bell, ToggleLeft, ToggleRight, Sparkles } from "lucide-react";

interface NotificationSetting {
  id: string;
  name: string;
  desc: string;
  enabled: boolean;
}

interface ReminderConfigProps {
  onSubmit: (settings: Record<string, boolean>) => void;
  onBack: () => void;
}

export default function ReminderConfig({ onSubmit, onBack }: ReminderConfigProps) {
  const [settings, setSettings] = useState<NotificationSetting[]>([
    {
      id: "s1",
      name: "Smart Pacing Breaks",
      desc: "Real-time browser notifications for breathing paces and stretch intervals.",
      enabled: true
    },
    {
      id: "s2",
      name: "Screen Detach Reminders",
      desc: "Receive a quick alarm 15 minutes before your scheduled digital screen boundary.",
      enabled: true
    },
    {
      id: "s3",
      name: "Weekly Pod Reports",
      desc: "Anonymous weekly summary of your peer pod's collective milestones and adherence rates.",
      enabled: false
    }
  ]);

  const handleToggle = (id: string) => {
    setSettings((prev) =>
      prev.map((s) => (s.id === id ? { ...s, enabled: !s.enabled } : s))
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const result = settings.reduce((acc, curr) => {
      acc[curr.id] = curr.enabled;
      return acc;
    }, {} as Record<string, boolean>);
    onSubmit(result);
  };

  return (
    <div className="space-y-8 animate-fade-in max-w-2xl mx-auto">
      <div className="space-y-3 text-center">
        <h2 className="text-2xl md:text-3xl font-bold text-slate-900 font-display">
          Set Up Notifications
        </h2>
        <p className="text-xs text-slate-505 max-w-md mx-auto">
          Choose how you would like CalmPulse to notify you of pacing milestones, boundary limits, and pod sync updates.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-4">
          {settings.map((set) => (
            <div
              key={set.id}
              className={`glass-panel border rounded-2xl p-6 transition-all bg-white flex justify-between items-center gap-6 ${
                set.enabled ? "border-slate-300" : "border-slate-200 opacity-60"
              }`}
            >
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-slate-900">{set.name}</h3>
                <p className="text-xs text-slate-500 leading-relaxed max-w-md">
                  {set.desc}
                </p>
              </div>

              <button
                type="button"
                onClick={() => handleToggle(set.id)}
                className="text-slate-700 hover:text-slate-905 transition-colors cursor-pointer shrink-0"
              >
                {set.enabled ? (
                  <ToggleRight className="w-9 h-9 text-slate-900" />
                ) : (
                  <ToggleLeft className="w-9 h-9 text-slate-300" />
                )}
              </button>
            </div>
          ))}
        </div>

        {/* Small privacy details alert */}
        <div className="flex items-start gap-2.5 text-xs text-slate-655 bg-slate-100 border border-slate-200 p-4 rounded-2xl">
          <Bell className="w-4 h-4 text-slate-700 shrink-0 mt-0.5" />
          <span className="leading-relaxed">
            <strong>Privacy Guarantee:</strong> CalmPulse notifications never display details about your anxiety subtype or emotional logs in clear text. Your privacy is fully protected.
          </span>
        </div>

        <div className="flex justify-between items-center pt-4">
          <button
            type="button"
            onClick={onBack}
            className="px-6 py-3.5 rounded-xl border border-slate-200 font-bold text-slate-700 hover:bg-slate-50 transition-all text-xs cursor-pointer"
          >
            Back
          </button>
          
          <button
            type="submit"
            className="px-8 py-3.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-xs shadow-md shadow-slate-900/10 cursor-pointer"
          >
            Finalize Settings
          </button>
        </div>
      </form>
    </div>
  );
}

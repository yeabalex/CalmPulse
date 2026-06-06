"use client";

import { useState } from "react";
import Link from "next/link";
import { CheckCircle2, Zap, Compass, Send, Check } from "lucide-react";
import GlassCard from "@/components/shared/GlassCard";
import HeartRateWidget from "@/components/shared/vitals/HeartRateWidget";
import CohortInfoWidget from "@/components/shared/vitals/CohortInfoWidget";

interface OnboardingCompleteProps {
  cohortId: number;
  habits: Array<{ id: string; name: string; type: string; value: string; enabled: boolean }>;
  syncTimes: { morning: string; evening: string };
}

export default function OnboardingComplete({ cohortId, habits, syncTimes }: OnboardingCompleteProps) {
  const [activeTab, setActiveTab] = useState<"pacing" | "pod">("pacing");
  const [messages, setMessages] = useState([
    { sender: "Peer #3", text: "Morning sync done. Feeling stable today.", time: "09:05 AM" },
    { sender: "Peer #7", text: "Excited to work on the screen detachment milestone tonight.", time: "10:12 AM" }
  ]);
  const [inputMessage, setInputMessage] = useState("");

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim()) return;
    setMessages((prev) => [
      ...prev,
      { sender: "You (Anonymous)", text: inputMessage.trim(), time: "Now" }
    ]);
    setInputMessage("");
  };

  return (
    <div className="space-y-8 animate-fade-in max-w-4xl mx-auto w-full">
      {/* Top success card */}
      <GlassCard className="border-emerald-100 bg-emerald-50/40 text-center space-y-3 shadow-sm p-8">
        <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 mx-auto">
          <CheckCircle2 className="w-7 h-7" />
        </div>
        <h2 className="text-2xl md:text-3.5xl font-bold text-slate-900 font-display">
          Onboarding Complete!
        </h2>
        <p className="text-xs text-slate-655 max-w-md mx-auto leading-relaxed">
          Your pacing scheduler is online and you have been safely integrated into <strong>Cohort Pod #{cohortId}</strong>. Welcome to CalmPulse.
        </p>
      </GlassCard>

      {/* Main Dashboard Preview Grid */}
      <div className="grid md:grid-cols-3 gap-8">
        
        {/* Left column: Quick Stats & Engine status */}
        <div className="space-y-6 md:col-span-1">
          
          {/* Active Engine Card */}
          <GlassCard className="shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">
                Pacing Engine
              </span>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            </div>
            
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center">
                <Zap className="w-5 h-5 fill-current" />
              </div>
              <div>
                <span className="text-base font-black text-slate-900">45% Decelerated</span>
                <span className="text-[10px] text-slate-400 font-semibold block">Adaptive Mode: ON</span>
              </div>
            </div>

            <div className="border-t border-slate-100 pt-4 flex justify-between text-[11px] text-slate-505">
              <span>Morning check-in:</span>
              <span className="font-extrabold text-slate-800">{syncTimes.morning}</span>
            </div>
            <div className="flex justify-between text-[11px] text-slate-555">
              <span>Evening reflection:</span>
              <span className="font-extrabold text-slate-800">{syncTimes.evening}</span>
            </div>
          </GlassCard>

          {/* Somatic Vitals Card */}
          <GlassCard className="shadow-sm space-y-4">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Somatic Telemetry
            </h3>

            <div className="space-y-3">
              {/* Reusable Heart Rate Vitals */}
              <HeartRateWidget bpm={95} />
              
              <div className="flex items-center gap-3 pt-2 border-t border-slate-50">
                <div className="w-9 h-9 rounded-xl bg-slate-100 text-cyan-500 flex items-center justify-center shrink-0">
                  <Compass className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">
                    Somatic Tension
                  </span>
                  <span className="text-base font-extrabold text-slate-900 block leading-tight">
                    Stable <span className="text-[10px] font-normal text-slate-500">(6.8/10)</span>
                  </span>
                </div>
              </div>
            </div>
          </GlassCard>

        </div>

        {/* Center/Right column: Interactive Dashboard Tabs */}
        <GlassCard className="md:col-span-2 shadow-sm flex flex-col min-h-[350px]">
          
          {/* Tab buttons */}
          <div className="flex gap-4 border-b border-slate-100 pb-4 mb-4">
            <button
              onClick={() => setActiveTab("pacing")}
              className={`pb-1 text-xs font-bold transition-all border-b-2 cursor-pointer ${
                activeTab === "pacing"
                  ? "border-slate-900 text-slate-900"
                  : "border-transparent text-slate-400 hover:text-slate-600"
              }`}
            >
              My Habits Schedule
            </button>
            <button
              onClick={() => setActiveTab("pod")}
              className={`pb-1 text-xs font-bold transition-all border-b-2 cursor-pointer ${
                activeTab === "pod"
                  ? "border-slate-900 text-slate-900"
                  : "border-transparent text-slate-400 hover:text-slate-600"
              }`}
            >
              Pod #{cohortId} Chat Log
            </button>
          </div>

          {/* Tab Content */}
          <div className="flex-1 flex flex-col justify-between">
            
            {activeTab === "pacing" ? (
              <div className="space-y-4">
                {habits.filter((h) => h.enabled).map((habit, idx) => (
                  <div
                    key={habit.id}
                    className="p-4 rounded-2xl bg-slate-50 border border-slate-200/50 flex justify-between items-center text-xs animate-fade-in"
                  >
                    <div className="space-y-1">
                      <span className="font-bold text-slate-900 block">{habit.name}</span>
                      <span className="text-[10px] text-slate-400 font-semibold block">
                        {habit.id === "h1" && `Detach screen at ${habit.value}`}
                        {habit.id === "h2" && `Breathing break triggers every ${habit.value} hours`}
                        {habit.id === "h3" && `Caffeine boundary activated ${habit.value} hours prior`}
                      </span>
                    </div>
                    
                    <button
                      onClick={() => alert(`Marked habit "${habit.name}" as completed today.`)}
                      className="w-7 h-7 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-650 flex items-center justify-center hover:bg-emerald-100 hover:text-emerald-700 transition-colors cursor-pointer"
                      title="Mark as completed today"
                    >
                      <Check className="w-4.5 h-4.5" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col h-full justify-between gap-4">
                {/* Chat Feed */}
                <div className="space-y-3 max-h-[200px] overflow-y-auto pr-2">
                  {messages.map((msg, idx) => (
                    <div key={idx} className="space-y-1 text-xs">
                      <div className="flex justify-between items-center text-[9px] font-bold text-slate-400 uppercase">
                        <span>{msg.sender}</span>
                        <span>{msg.time}</span>
                      </div>
                      <div className="bg-slate-50 border border-slate-200 p-3 rounded-2xl rounded-tl-none text-slate-700">
                        {msg.text}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Chat Input */}
                <form onSubmit={handleSendMessage} className="flex gap-2 border-t border-slate-100 pt-3">
                  <input
                    type="text"
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    placeholder="Send an anonymous message to your Pod..."
                    className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-805 focus:ring-1 focus:ring-slate-900 focus:outline-none"
                  />
                  <button
                    type="submit"
                    className="bg-slate-900 text-white p-2 rounded-xl hover:bg-slate-800 transition-colors flex items-center justify-center cursor-pointer"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </form>
              </div>
            )}

          </div>

        </GlassCard>

      </div>

      {/* Reusable Cohort Info Block */}
      <GlassCard className="shadow-sm flex items-center py-4 px-6">
        <CohortInfoWidget podId={cohortId} activeCount={5} totalCount={8} />
      </GlassCard>

      {/* Primary CTA back to homepage */}
      <div className="flex justify-center pt-4">
        <Link
          href="/"
          className="px-8 py-4 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl font-bold text-xs shadow-md shadow-slate-900/10 hover:scale-[1.02] transition-all"
        >
          Return to CalmPulse Home
        </Link>
      </div>

    </div>
  );
}

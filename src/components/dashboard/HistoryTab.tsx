"use client";

import { useState } from "react";
import { Calendar, ChevronDown, ChevronUp, CheckCircle, MessageSquare, Activity } from "lucide-react";
import GlassCard from "@/components/shared/GlassCard";

export interface HistoryEntry {
  id: string;
  date: string;
  anxietyScore: number;
  ventText: string;
  completedCount: number;
  totalCount: number;
  completedHabits: string[];
}

interface HistoryTabProps {
  history: HistoryEntry[];
}

export default function HistoryTab({ history }: HistoryTabProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl mx-auto">
      <div className="text-left space-y-1 shrink-0">
        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <Calendar className="w-4.5 h-4.5 text-slate-700" />
          Pacing History Log
        </h3>
        <p className="text-[10px] text-slate-500">
          Review your past emotional logs, recalibration scores, and habit completions.
        </p>
      </div>

      <div className="space-y-4">
        {history.length === 0 ? (
          <GlassCard className="p-8 text-center text-slate-400 bg-white border border-slate-200/60">
            <p className="text-xs font-bold">No history logs recorded yet.</p>
            <p className="text-[10px] text-slate-500 mt-1">
              Your historical pacing records will populate here as you submit daily reflections.
            </p>
          </GlassCard>
        ) : (
          history.map((entry) => {
            const isExpanded = expandedId === entry.id;
            
            // Map scores to color themes
            let scoreBg = "bg-emerald-50 text-emerald-800 border-emerald-200";
            if (entry.anxietyScore >= 7) {
              scoreBg = "bg-rose-50 text-rose-800 border-rose-200";
            } else if (entry.anxietyScore >= 5) {
              scoreBg = "bg-amber-50 text-amber-800 border-amber-200";
            }

            return (
              <GlassCard
                key={entry.id}
                className="p-5 bg-white border border-slate-200/60 shadow-sm hover:border-slate-300 transition-all flex flex-col gap-4 cursor-pointer"
                onClick={() => toggleExpand(entry.id)}
              >
                {/* Header Summary */}
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-900 shrink-0">
                      <Calendar className="w-5 h-5 text-slate-700" />
                    </div>
                    <div className="text-left min-w-0">
                      <span className="text-xs font-bold text-slate-900 block">{entry.date}</span>
                      <span className="text-[10px] text-slate-450 block truncate max-w-[200px] sm:max-w-md">
                        &ldquo;{entry.ventText}&rdquo;
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    {/* Score Badge */}
                    <div className={`px-3 py-1 rounded-full border text-[10px] font-extrabold flex items-center gap-1 ${scoreBg}`}>
                      <Activity className="w-3.5 h-3.5" />
                      {entry.anxietyScore.toFixed(1)}
                    </div>

                    {/* Habits Completed Badge */}
                    <div className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 text-[10px] font-bold flex items-center gap-1">
                      <CheckCircle className="w-3.5 h-3.5 text-slate-500" />
                      {entry.completedCount}/{entry.totalCount} Habits
                    </div>

                    {/* Expand Arrow */}
                    <div className="text-slate-400 hover:text-slate-650 transition-colors p-1">
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </div>
                  </div>
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="border-t border-slate-100 pt-4 mt-2 space-y-4 text-left animate-fade-in">
                    {/* Vent Text Log */}
                    <div className="space-y-1.5">
                      <span className="text-[10px] font-bold text-slate-450 flex items-center gap-1 uppercase tracking-wider">
                        <MessageSquare className="w-3.5 h-3.5" />
                        Written Vent Journal
                      </span>
                      <p className="text-xs text-slate-750 bg-slate-50 border border-slate-100 rounded-2xl p-4 italic leading-relaxed">
                        &ldquo;{entry.ventText}&rdquo;
                      </p>
                    </div>

                    {/* Habits Completed Details */}
                    <div className="space-y-2">
                      <span className="text-[10px] font-bold text-slate-450 flex items-center gap-1 uppercase tracking-wider">
                        <CheckCircle className="w-3.5 h-3.5" />
                        Completed Habits Checklist
                      </span>
                      <div className="flex flex-wrap gap-2">
                        {entry.completedHabits.map((habit, idx) => (
                          <span
                            key={idx}
                            className="px-3.5 py-1.5 rounded-full bg-emerald-50 border border-emerald-100 text-[10px] font-semibold text-emerald-800 flex items-center gap-1"
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                            {habit}
                          </span>
                        ))}
                        {entry.completedHabits.length === 0 && (
                          <span className="text-[10px] text-slate-450 font-medium">No habits completed on this day.</span>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </GlassCard>
            );
          })
        )}
      </div>
    </div>
  );
}

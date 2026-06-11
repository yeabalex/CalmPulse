"use client";

import { X, Loader2, Clock, Lightbulb, ListOrdered } from "lucide-react";
import GlassCard from "@/components/shared/GlassCard";
import type { ActivityDetail } from "@/lib/activityDetailCache";

export type { ActivityDetail };

interface ActivityInfo {
  id: string;
  name: string;
  type: string;
  description?: string;
}

interface ActivityDetailModalProps {
  activity: ActivityInfo;
  detail: ActivityDetail | null;
  loading: boolean;
  error: string;
  onClose: () => void;
}

export default function ActivityDetailModal({
  activity,
  detail,
  loading,
  error,
  onClose,
}: ActivityDetailModalProps) {
  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-6 animate-fade-in">
      <GlassCard className="max-w-lg w-full max-h-[85vh] overflow-hidden border border-slate-200 bg-white shadow-2xl rounded-3xl flex flex-col animate-scale-in">
        <div className="p-6 border-b border-slate-100 shrink-0">
          <div className="flex justify-between items-start gap-4">
            <div className="min-w-0">
              <span className="text-[9px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                {activity.type}
              </span>
              <h3 className="text-base font-bold text-slate-900 leading-tight">{activity.name}</h3>
              {activity.description && (
                <p className="text-[10px] text-slate-500 mt-1 leading-relaxed">{activity.description}</p>
              )}
            </div>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-100 cursor-pointer shrink-0"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="p-6 overflow-y-auto flex-1 space-y-5">
          {loading && (
            <div className="py-12 flex flex-col items-center justify-center gap-3">
              <Loader2 className="w-8 h-8 text-slate-800 animate-spin" />
              <span className="text-xs font-semibold text-slate-500">
                Generating your personalized activity guide...
              </span>
            </div>
          )}

          {!loading && error && (
            <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl">
              <p className="text-xs font-semibold text-rose-800">{error}</p>
            </div>
          )}

          {!loading && detail && (
            <>
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-900">Overview</h4>
                <p className="text-xs text-slate-600 leading-relaxed">{detail.overview}</p>
              </div>

              <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500">
                <Clock className="w-3.5 h-3.5" />
                Estimated time: {detail.estimatedDuration}
              </div>

              <div className="space-y-2 p-4 bg-slate-50 border border-slate-200 rounded-2xl">
                <h4 className="text-xs font-bold text-slate-900">How to do this activity</h4>
                <p className="text-xs text-slate-700 leading-relaxed">
                  {detail.howToDo || detail.overview}
                </p>
              </div>

              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  <ListOrdered className="w-3.5 h-3.5 text-slate-700" />
                  Step-by-step
                </h4>
                <ol className="space-y-2.5">
                  {detail.steps.map((step, idx) => (
                    <li key={idx} className="flex gap-3 text-xs text-slate-700 leading-relaxed">
                      <span className="w-5 h-5 rounded-full bg-slate-900 text-white flex items-center justify-center text-[9px] font-bold shrink-0 mt-0.5">
                        {idx + 1}
                      </span>
                      <span>{step}</span>
                    </li>
                  ))}
                </ol>
              </div>

              {detail.tips.length > 0 && (
                <div className="space-y-2 p-4 bg-amber-50/60 border border-amber-100 rounded-2xl">
                  <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <Lightbulb className="w-3.5 h-3.5 text-amber-600" />
                    Coach tips
                  </h4>
                  <ul className="space-y-1.5">
                    {detail.tips.map((tip, idx) => (
                      <li key={idx} className="text-[11px] text-slate-600 leading-relaxed pl-1">
                        • {tip}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          )}
        </div>

        <div className="p-6 border-t border-slate-100 shrink-0">
          <button
            onClick={onClose}
            className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-xs cursor-pointer"
          >
            Got it
          </button>
        </div>
      </GlassCard>
    </div>
  );
}

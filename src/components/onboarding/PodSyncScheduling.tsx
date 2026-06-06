"use client";

import { useState } from "react";
import { Users, Clock } from "lucide-react";

interface SyncTimes {
  morning: string;
  evening: string;
}

interface PodSyncSchedulingProps {
  cohortId: number;
  onSubmit: (times: SyncTimes) => void;
  onBack: () => void;
}

export default function PodSyncScheduling({ cohortId, onSubmit, onBack }: PodSyncSchedulingProps) {
  const [syncTimes, setSyncTimes] = useState<SyncTimes>({
    morning: "09:00",
    evening: "21:00"
  });

  const handleTimeChange = (type: keyof SyncTimes, value: string) => {
    setSyncTimes((prev) => ({
      ...prev,
      [type]: value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(syncTimes);
  };

  return (
    <div className="space-y-8 animate-fade-in max-w-2xl mx-auto">
      <div className="space-y-3 text-center">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-xs font-bold text-slate-800">
          <Users className="w-3.5 h-3.5" />
          Cohort Pod #{cohortId}
        </div>
        <h2 className="text-2xl md:text-3xl font-bold text-slate-900 font-display">
          Schedule Daily Pod Syncs
        </h2>
        <p className="text-xs text-slate-505 max-w-md mx-auto">
          CalmPulse operates on shared reflection targets. To protect anonymity, you don&apos;t live chat — instead, your daily metrics update in sync batches. Select your check-in times.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid sm:grid-cols-2 gap-6">
          
          {/* Morning Sync */}
          <div className="glass-panel border border-slate-200 rounded-2xl p-6 bg-white space-y-4 shadow-sm hover:border-slate-350 transition-colors">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Clock className="w-4.5 h-4.5 text-slate-700" />
              Morning Intentions
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Verify your physical baseline when waking up. Your pod mates will check in around the same time.
            </p>
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-3.5 py-2 rounded-xl text-xs w-full max-w-[150px]">
              <span className="text-[10px] text-slate-400 font-bold uppercase">TIME:</span>
              <input
                type="time"
                value={syncTimes.morning}
                onChange={(e) => handleTimeChange("morning", e.target.value)}
                className="bg-transparent border-0 p-0 text-xs font-extrabold text-slate-800 focus:ring-0 focus:outline-none w-14"
              />
            </div>
          </div>

          {/* Evening Sync */}
          <div className="glass-panel border border-slate-200 rounded-2xl p-6 bg-white space-y-4 shadow-sm hover:border-slate-350 transition-colors">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Clock className="w-4.5 h-4.5 text-slate-700" />
              Evening Detach
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Log your daily habit compliance and reflect on somatic fluctuations before starting screen detach schedules.
            </p>
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-3.5 py-2 rounded-xl text-xs w-full max-w-[150px]">
              <span className="text-[10px] text-slate-400 font-bold uppercase">TIME:</span>
              <input
                type="time"
                value={syncTimes.evening}
                onChange={(e) => handleTimeChange("evening", e.target.value)}
                className="bg-transparent border-0 p-0 text-xs font-extrabold text-slate-800 focus:ring-0 focus:outline-none w-14"
              />
            </div>
          </div>

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
            Confirm Syncs
          </button>
        </div>
      </form>
    </div>
  );
}

"use client";

import { Heart } from "lucide-react";

interface HeartRateWidgetProps {
  bpm: number;
}

export default function HeartRateWidget({ bpm }: HeartRateWidgetProps) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-9 h-9 rounded-xl bg-slate-100 text-rose-500 flex items-center justify-center animate-pulse shrink-0">
        <Heart className="w-5 h-5 fill-current" />
      </div>
      <div>
        <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">
          Heart Rate
        </span>
        <span className="text-base font-extrabold text-slate-900 block leading-tight">
          {bpm} <span className="text-[10px] font-normal text-slate-500">BPM</span>
        </span>
      </div>
    </div>
  );
}

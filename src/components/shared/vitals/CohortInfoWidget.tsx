"use client";

import { Users } from "lucide-react";

interface CohortInfoWidgetProps {
  podId: number;
  activeCount?: number;
  totalCount?: number;
}

export default function CohortInfoWidget({
  podId,
  activeCount = 5,
  totalCount = 8
}: CohortInfoWidgetProps) {
  return (
    <div className="flex items-center gap-3 w-full">
      <div className="w-8 h-8 rounded-full bg-slate-150 flex items-center justify-center text-slate-800 shrink-0">
        <Users className="w-4 h-4 text-slate-700" />
      </div>
      <div className="min-w-0 flex-1">
        <span className="text-xs font-bold text-slate-900 block truncate">
          Anonymous Cohort Pod #{podId}
        </span>
        <span className="text-[10px] text-slate-600 truncate block">
          {activeCount} of {totalCount} Peers actively pacing today
        </span>
      </div>
    </div>
  );
}

"use client";

import { MessageSquare, ChevronRight } from "lucide-react";

interface CohortInfoWidgetProps {
  podId?: number;
  activeCount?: number;
  totalCount?: number;
  onClick?: () => void;
}

export default function CohortInfoWidget({
  onClick,
}: CohortInfoWidgetProps) {
  const content = (
    <>
      <div className="w-8 h-8 rounded-full bg-slate-150 flex items-center justify-center text-slate-800 shrink-0">
        <MessageSquare className="w-4 h-4 text-slate-700" />
      </div>
      <div className="min-w-0 flex-1 text-left">
        <span className="text-xs font-bold text-slate-900 block truncate">
          AI Pacing Companion
        </span>
        <span className="text-[10px] text-slate-600 truncate block">
          Active and monitoring pacing status
        </span>
      </div>
      {onClick && <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />}
    </>
  );

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className="flex items-center gap-3 w-full p-2 -m-2 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer"
      >
        {content}
      </button>
    );
  }

  return <div className="flex items-center gap-3 w-full">{content}</div>;
}

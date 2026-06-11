"use client";

import { X, Circle } from "lucide-react";
import GlassCard from "@/components/shared/GlassCard";

interface PodMember {
  id: string;
  displayName: string;
  isCurrentUser: boolean;
  activeToday: boolean;
}

interface PodMembersModalProps {
  podNumber: number;
  focusArea: string;
  members: PodMember[];
  onClose: () => void;
}

export default function PodMembersModal({
  podNumber,
  focusArea,
  members,
  onClose,
}: PodMembersModalProps) {
  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-6 animate-fade-in">
      <GlassCard className="max-w-sm w-full p-6 border border-slate-200 bg-white shadow-2xl rounded-3xl space-y-5 animate-scale-in">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-base font-bold text-slate-900">Cohort Pod #{podNumber}</h3>
            <p className="text-[10px] text-slate-500 mt-0.5">{focusArea}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-100 cursor-pointer"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-[10px] text-slate-500 leading-relaxed">
          Only first names are shown to protect anonymity. Green dots indicate peers who checked in today.
        </p>

        <div className="space-y-2">
          {members.map((member) => (
            <div
              key={member.id}
              className={`flex items-center justify-between p-3 rounded-2xl border ${
                member.isCurrentUser
                  ? "bg-slate-50 border-slate-300"
                  : "bg-white border-slate-200/70"
              }`}
            >
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-700">
                  {member.displayName.charAt(0)}
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-900 block">
                    {member.displayName}
                    {member.isCurrentUser && (
                      <span className="text-[9px] font-semibold text-slate-500 ml-1.5">(You)</span>
                    )}
                  </span>
                  <span className="text-[9px] text-slate-500">
                    {member.activeToday ? "Active today" : "Not checked in today"}
                  </span>
                </div>
              </div>
              <Circle
                className={`w-2.5 h-2.5 shrink-0 ${
                  member.activeToday
                    ? "fill-emerald-500 text-emerald-500"
                    : "fill-slate-200 text-slate-200"
                }`}
              />
            </div>
          ))}
        </div>

        <button
          onClick={onClose}
          className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-xs cursor-pointer"
        >
          Close
        </button>
      </GlassCard>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CheckCircle2, Zap, Compass } from "lucide-react";
import GlassCard from "@/components/shared/GlassCard";
import CohortInfoWidget from "@/components/shared/vitals/CohortInfoWidget";

interface OnboardingAssessment {
  report?: {
    anxietyScore?: number;
    pacingRate?: string;
  };
  initialBaseline?: {
    anxietyScore?: number;
    pacingRate?: string;
  };
}

interface OnboardingCompleteProps {
  cohortId: number;
  assessment?: OnboardingAssessment;
}

interface PodInfo {
  podNumber: number;
  activeCount: number;
  memberCount: number;
}

export default function OnboardingComplete({ cohortId, assessment }: OnboardingCompleteProps) {
  const [podInfo, setPodInfo] = useState<PodInfo | null>(null);
  const report = assessment?.report || assessment?.initialBaseline;

  useEffect(() => {
    fetch("/api/pod")
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => {
        if (json?.pod) {
          setPodInfo({
            podNumber: json.pod.podNumber,
            activeCount: json.pod.activeCount,
            memberCount: json.pod.memberCount,
          });
        }
      })
      .catch(() => {});
  }, []);
  
  // Real pacing rate
  const pacingRate = report?.pacingRate || "35% Decelerated";
  
  // Real somatic tension score
  const tensionScore = report?.anxietyScore || 7.0;
  
  // Somatic tension status
  let tensionStatus = "Stable";
  if (tensionScore >= 8) {
    tensionStatus = "Elevated";
  } else if (tensionScore >= 6) {
    tensionStatus = "Moderate";
  } else {
    tensionStatus = "Stable";
  }

  return (
    <div className="space-y-8 animate-fade-in max-w-3xl mx-auto w-full">
      {/* Top success card */}
      <GlassCard className="border-emerald-100 bg-emerald-50/40 text-center space-y-3 shadow-sm p-8">
        <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 mx-auto">
          <CheckCircle2 className="w-7 h-7" />
        </div>
        <h2 className="text-2xl md:text-3.5xl font-bold text-slate-900 font-display">
          Onboarding Complete!
        </h2>
        <p className="text-xs text-slate-600 max-w-md mx-auto leading-relaxed">
          Your pacing scheduler is online and you have been safely integrated into <strong>Cohort Pod #{podInfo?.podNumber ?? cohortId}</strong>. Welcome to CalmPulse.
        </p>
      </GlassCard>

      {/* Main Preview Grid */}
      <div className="grid md:grid-cols-2 gap-8 w-full">
        
        {/* Pacing Engine Card */}
        <GlassCard className="shadow-sm space-y-4 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">
                Pacing Engine
              </span>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            </div>
            
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center shrink-0">
                <Zap className="w-5 h-5 fill-current" />
              </div>
              <div>
                <span className="text-base font-black text-slate-900">{pacingRate}</span>
                <span className="text-[10px] text-slate-400 font-semibold block">Adaptive Pacing: Enabled</span>
              </div>
            </div>
          </div>

          <div className="border-t border-slate-100 pt-3 text-[11px] text-slate-500 leading-relaxed space-y-2">
            <p className="font-bold text-slate-800">What does this mean?</p>
            <p>
              This is your nervous system deceleration target. It represents how much you need to slow down your daily workflow/activity cycles and build in somatic pauses to prevent stress accumulation and restore autonomic balance.
            </p>
          </div>
        </GlassCard>

        {/* Somatic Telemetry Card */}
        <GlassCard className="shadow-sm space-y-4 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">
                Somatic Telemetry
              </span>
              <span className="w-2.5 h-2.5 rounded-full bg-slate-900/10" />
            </div>

            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-900 flex items-center justify-center shrink-0">
                <Compass className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">
                  Somatic Tension Baseline
                </span>
                <span className="text-base font-extrabold text-slate-900 block leading-tight">
                  {tensionStatus} <span className="text-[10px] font-normal text-slate-500">({tensionScore}/10)</span>
                </span>
              </div>
            </div>
          </div>

          <div className="border-t border-slate-100 pt-3 text-[11px] text-slate-500 leading-relaxed space-y-2">
            <p className="font-bold text-slate-800">What does this mean?</p>
            <p>
              This is your subjective anxiety and nervous system tension score calculated from your intake symptoms and expressive vent logs. The app uses this baseline to personalize your pacing schedule.
            </p>
          </div>
        </GlassCard>

      </div>

      {/* Cohort Info Widget */}
      <GlassCard className="shadow-sm flex items-center py-4 px-6">
        <CohortInfoWidget
          podId={podInfo?.podNumber ?? cohortId}
          activeCount={podInfo?.activeCount ?? 0}
          totalCount={podInfo?.memberCount ?? 1}
        />
      </GlassCard>

      {/* Go to Dashboard CTA */}
      <div className="flex justify-center pt-4">
        <Link
          href="/dashboard"
          className="px-8 py-4 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl font-bold text-xs shadow-md shadow-slate-900/10 hover:scale-[1.02] transition-all cursor-pointer text-center"
        >
          Go to Dashboard
        </Link>
      </div>

    </div>
  );
}

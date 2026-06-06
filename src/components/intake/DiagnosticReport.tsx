"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ShieldCheck, Zap, Users, RefreshCw, Activity, ArrowRight } from "lucide-react";
import GlassCard from "@/components/shared/GlassCard";
import TensionDial from "@/components/shared/vitals/TensionDial";

export interface DiagnosticReportData {
  anxietyScore: number;
  subtype: string;
  symptoms: string[];
  pacingRate: string;
  adjustments: Array<{ name: string; type: string; trigger: string }>;
  cohortId: number;
  cohortDescription: string;
}

interface DiagnosticReportProps {
  report: DiagnosticReportData;
  onReset: () => void;
}

export default function DiagnosticReport({ report, onReset }: DiagnosticReportProps) {
  const router = useRouter();

  return (
    <div className="space-y-8 animate-fade-in max-w-4xl mx-auto">
      
      {/* Top Banner */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-xs font-bold text-emerald-800">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          Assessment Formulated
        </div>
        <h2 className="text-2xl md:text-3.5xl font-bold text-slate-900 font-display">
          Your Behavioral Pacing Baseline
        </h2>
        <p className="text-xs text-slate-505 max-w-lg mx-auto">
          We have successfully synthesized your emotional log. Below is your structured anxiety profile and dynamic pacing guide.
        </p>
      </div>

      {/* Main Grid */}
      <div className="grid md:grid-cols-3 gap-8">
        
        {/* Left Card: Score Meter (Using Reusable TensionDial in medium size) */}
        <GlassCard className="flex flex-col items-center justify-between shadow-sm md:col-span-1 min-h-[300px]">
          <TensionDial score={report.anxietyScore} size="md" />

          <div className="text-center space-y-1 mt-6 border-t border-slate-100 pt-4 w-full">
            <span className="text-xs font-bold text-slate-800 block">
              {report.subtype}
            </span>
            <span className="text-[10px] text-slate-500 block">
              Pacing Rate: <span className="font-extrabold text-slate-800">{report.pacingRate}</span>
            </span>
          </div>
        </GlassCard>

        {/* Center Card: Symptom Tags & Adjustments */}
        <div className="md:col-span-2 space-y-8">
          
          {/* Somatic / Cognitive Symptoms */}
          <GlassCard className="p-6.5 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Activity className="w-4.5 h-4.5 text-slate-800" />
              Identified Symptoms & Triggers
            </h3>
            
            <div className="flex flex-wrap gap-2.5">
              {report.symptoms.map((symp, idx) => (
                <span
                  key={idx}
                  className="px-3.5 py-1.5 rounded-full bg-slate-100 border border-slate-200/50 text-xs font-semibold text-slate-700"
                >
                  {symp}
                </span>
              ))}
            </div>
          </GlassCard>

          {/* Dynamic Pacing Adjustments */}
          <GlassCard className="p-6.5 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Zap className="w-4.5 h-4.5 text-slate-800" />
              Dynamic Pacing Adjustments
            </h3>

            <div className="space-y-3">
              {report.adjustments.map((adj, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-2xl bg-slate-50 border border-slate-200/50 flex justify-between items-center text-xs"
                >
                  <div className="space-y-1">
                    <span className="font-bold text-slate-900 block">{adj.name}</span>
                    <span className="text-[10px] text-slate-400 font-semibold block">{adj.trigger}</span>
                  </div>
                  <span className="px-2.5 py-1 rounded-full bg-slate-900/10 text-slate-805 font-bold uppercase tracking-wider text-[9px]">
                    {adj.type}
                  </span>
                </div>
              ))}
            </div>
          </GlassCard>

        </div>

      </div>

      {/* Account Creation CTA */}
      <GlassCard className="p-8 shadow-md flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="space-y-2 text-center md:text-left">
          <div className="inline-flex items-center gap-2 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
            <Users className="w-4 h-4 text-slate-655" />
            Next Step: Save Profile
          </div>
          <h3 className="text-lg font-bold text-slate-900">
            Save Your Baseline & Start Pacing
          </h3>
          <p className="text-xs text-slate-500 max-w-xl">
            Create your account to lock in your personalized pacing rate, activate somatic adjustments, and sync with your anonymous peer pod.
          </p>
        </div>
        
        <button
          onClick={() => router.push(`/onboarding?cohortId=${report.cohortId}`)}
          className="group px-6 py-4.5 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl flex items-center justify-center gap-2 font-bold text-xs transition-all shadow-md cursor-pointer shrink-0"
        >
          Create Your Account
          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </button>
      </GlassCard>

      {/* Reset Button */}
      <div className="flex justify-center pt-4">
        <button
          onClick={onReset}
          className="flex items-center gap-2 px-6 py-3 border border-slate-200 hover:bg-slate-50 rounded-xl text-xs font-bold text-slate-650 cursor-pointer"
        >
          <RefreshCw className="w-4 h-4" />
          Retake Assessment
        </button>
      </div>

    </div>
  );
}

"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";

interface WizardHeaderProps {
  currentStep: number;
  steps: string[];
  backUrl?: string;
}

export default function WizardHeader({ currentStep, steps, backUrl }: WizardHeaderProps) {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 glass-panel border-b border-slate-200/40 py-4 px-6 md:px-12 flex justify-between items-center transition-all duration-300">
      <div className="flex items-center gap-4">
        {backUrl && (
          <Link
            href={backUrl}
            className="p-2 hover:bg-slate-100 rounded-full transition-colors flex items-center justify-center text-slate-600 hover:text-slate-900"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
        )}
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-slate-900 flex items-center justify-center text-white font-bold text-sm">
            C
          </div>
          <span className="text-lg font-bold tracking-tight text-slate-900">
            Calm<span className="font-display italic text-slate-600 font-semibold">Pulse</span>
          </span>
        </div>
      </div>

      {/* Progress indicators */}
      <div className="hidden sm:flex items-center gap-6 text-xs font-semibold text-slate-500">
        {steps.map((stepName, idx) => {
          const stepNum = idx + 1;
          const isActive = currentStep === stepNum;
          const isCompleted = currentStep > stepNum;
          
          return (
            <div key={idx} className="flex items-center gap-2">
              <span
                className={`w-6 h-6 rounded-full flex items-center justify-center border text-[10px] transition-all duration-300 ${
                  isActive
                    ? "bg-slate-900 border-slate-900 text-white font-bold scale-110 shadow-sm"
                    : isCompleted
                    ? "bg-emerald-100 border-emerald-300 text-emerald-700"
                    : "border-slate-200 bg-white text-slate-400"
                }`}
              >
                {isCompleted ? "✓" : stepNum}
              </span>
              <span className={isActive ? "text-slate-900 font-bold" : "text-slate-400 font-medium"}>
                {stepName}
              </span>
              {idx < steps.length - 1 && (
                <div className="w-4 h-0.5 bg-slate-200" />
              )}
            </div>
          );
        })}
      </div>

      <div className="text-xs font-bold text-slate-700 sm:hidden">
        Step {currentStep} of {steps.length}
      </div>
    </header>
  );
}

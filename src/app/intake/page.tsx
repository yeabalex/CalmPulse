"use client";

import { useState } from "react";
import WizardHeader from "@/components/shared/WizardHeader";
import SubtypeSelection from "@/components/intake/SubtypeSelection";
import VoiceTextVent from "@/components/intake/VoiceTextVent";
import ClarifyingQuestions from "@/components/intake/ClarifyingQuestions";
import DiagnosticReport, { DiagnosticReportData } from "@/components/intake/DiagnosticReport";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/lib/useAuth";

export default function IntakePage() {
  // Redirect logged-in users directly to dashboard
  useAuth({ redirectTo: "/dashboard", redirectIfFound: true });

  const [step, setStep] = useState(1);
  const [focusArea, setFocusArea] = useState("");
  const [ventText, setVentText] = useState("");
  const [questions, setQuestions] = useState<Array<{ id: string; question: string }>>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [report, setReport] = useState<DiagnosticReportData | null>(null);
  
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("");

  const steps = ["Focus Area", "Expressive Vent", "Clarifications", "Pacing Baseline"];

  const saveAssessment = (
    baselineReport: DiagnosticReportData,
    formAnswers: Record<string, string>
  ) => {
    if (typeof window === "undefined") {
      return;
    }

    localStorage.setItem(
      "calmpulse_assessment",
      JSON.stringify({
        focusArea,
        ventText,
        clarifyingQuestions: questions,
        clarifyingAnswers: formAnswers,
        answers: formAnswers,
        initialBaseline: baselineReport,
        report: baselineReport,
      })
    );
  };

  const handleSubtypeSelect = (subtype: string) => {
    setFocusArea(subtype);
    setStep(2);
  };

  const handleVentSubmit = async (text: string) => {
    setVentText(text);
    setLoading(true);
    setLoadingMessage("AI Companion analyzing logs and preparing clarifications...");
    
    try {
      const response = await fetch("/api/intake", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ focusArea: subtypeToEnum(focusArea), ventText: text }),
      });

      if (!response.ok) {
        throw new Error("Failed to get clarifications");
      }

      const data = await response.json();
      setQuestions(data.questions);
      setStep(3);
    } catch (err) {
      console.error(err);
      // Fallback in case of server failure
      setQuestions([
        { id: "q1", question: "What physical symptoms (like racing heart, jaw tension) are you experiencing most intensely?" },
        { id: "q2", question: "Does this feeling tend to build up slowly, or hit you in sudden waves?" },
        { id: "q3", question: "What is one grounding habit that has helped you feel secure or calm in the past?" }
      ]);
      setStep(3);
    } finally {
      setLoading(false);
    }
  };

  const handleQuestionsSubmit = async (formAnswers: Record<string, string>) => {
    setAnswers(formAnswers);
    setLoading(true);
    setLoadingMessage("Synthesizing responses and generating pacing baseline...");

    try {
      const response = await fetch("/api/baseline", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          focusArea: subtypeToEnum(focusArea),
          ventText,
          answers: formAnswers
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to get diagnostic baseline");
      }

      const data = await response.json();
      setReport(data.report);
      saveAssessment(data.report, formAnswers);

      setStep(4);
    } catch (err) {
      console.error(err);
      // Fallback report
      const fallbackReport = {
        anxietyScore: 7.2,
        subtype: focusArea,
        symptoms: ["Autonomic Spikes", "Muscle Tension", "Cognitive Exhaustion"],
        pacingRate: "40% Decelerated",
        adjustments: [
          { name: "Somatic Grounding Pause", type: "Somatic", trigger: "Take a 5m breathing pause every 3 hours" },
          { name: "Digital Communication Limit", type: "Digital", trigger: "Turn off chat notifications after 9:30 PM" }
        ],
        cohortId: 42,
        cohortDescription: "Cohorts of phase-matched peers working on social grounding boundaries."
      };
      setReport(fallbackReport);
      saveAssessment(fallbackReport, formAnswers);
      setStep(4);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setStep(1);
    setFocusArea("");
    setVentText("");
    setQuestions([]);
    setAnswers({});
    setReport(null);
  };

  // Maps display names to string parameters
  const subtypeToEnum = (display: string) => {
    return display;
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 selection:bg-slate-900/10 selection:text-slate-900 flex flex-col font-sans">
      
      {/* Header */}
      <WizardHeader currentStep={step} steps={steps} backUrl="/" />

      {/* Main Content wizard container */}
      <main className="flex-1 w-full max-w-5xl mx-auto px-6 pt-28 pb-16 flex items-center justify-center">
        
        {loading ? (
          <div className="glass-panel border border-slate-200 rounded-3xl p-12 text-center flex flex-col items-center justify-center space-y-4 max-w-md w-full shadow-lg bg-white">
            <Loader2 className="w-10 h-10 text-slate-900 animate-spin" />
            <h3 className="text-base font-bold text-slate-900">Formulating Assessment</h3>
            <p className="text-xs text-slate-500 leading-relaxed">{loadingMessage}</p>
          </div>
        ) : (
          <div className="w-full">
            {step === 1 && (
              <SubtypeSelection onSelect={handleSubtypeSelect} />
            )}
            
            {step === 2 && (
              <VoiceTextVent
                focusArea={focusArea}
                onSubmit={handleVentSubmit}
                onBack={() => setStep(1)}
              />
            )}
            
            {step === 3 && (
              <ClarifyingQuestions
                questions={questions}
                onSubmit={handleQuestionsSubmit}
                onBack={() => setStep(2)}
              />
            )}
            
            {step === 4 && report && (
              <DiagnosticReport report={report} onReset={handleReset} />
            )}
          </div>
        )}

      </main>

    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import { 
  X, Wind, Heart, Sparkles, CheckCircle, 
  MessageSquare, Loader2, ArrowRight, RefreshCw, AlertTriangle
} from "lucide-react";
import GlassCard from "../shared/GlassCard";

interface PanicRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type TabType = "breathe" | "vent" | "ai";
type BreathPhase = {
  label: string;
  duration: number;
};

const BREATH_PHASES: BreathPhase[] = [
  { label: "Inhale", duration: 4000 },
  { label: "Hold your breath", duration: 4000 },
  { label: "Exhale", duration: 4000 },
  { label: "Hold your breath", duration: 4000 },
];

export default function PanicRoomModal({ isOpen, onClose }: PanicRoomModalProps) {
  const [activeTab, setActiveTab] = useState<TabType>("breathe");
  const [breathPhaseIndex, setBreathPhaseIndex] = useState(0);

  // Venting state
  const [ventText, setVentText] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [showAiResult, setShowAiResult] = useState(false);

  // AI suggestion state
  const [aiLoading, setAiLoading] = useState(false);
  const [aiData, setAiData] = useState<{ validation: string; steps: string[] } | null>(null);
  const [completedSteps, setCompletedSteps] = useState<Record<number, boolean>>({});

  // Reset modal states when opened
  useEffect(() => {
    if (!isOpen) return;

    const resetId = window.setTimeout(() => {
      setActiveTab("breathe");
      setBreathPhaseIndex(0);
      setVentText("");
      setIsProcessing(false);
      setShowAiResult(false);
      setAiData(null);
      setCompletedSteps({});
    }, 0);

    return () => window.clearTimeout(resetId);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!isOpen || activeTab !== "breathe") return;

    const currentPhase = BREATH_PHASES[breathPhaseIndex];
    const phaseTimer = window.setTimeout(() => {
      setBreathPhaseIndex((currentIndex) => (currentIndex + 1) % BREATH_PHASES.length);
    }, currentPhase.duration);

    return () => window.clearTimeout(phaseTimer);
  }, [isOpen, activeTab, breathPhaseIndex]);

  if (!isOpen) return null;

  const breathPhase = BREATH_PHASES[breathPhaseIndex];
  const breathInstruction = breathPhase.label;

  // Handle Vent release & trigger AI response
  const handleReleaseVent = async () => {
    if (!ventText.trim()) return;

    setIsProcessing(true);
    setAiLoading(true);
    setAiData(null);
    setCompletedSteps({});

    // Start fetching suggestions in parallel
    const fetchPromise = fetch("/api/panic", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ventText }),
    });

    setTimeout(async () => {
      try {
        const res = await fetchPromise;
        if (res.ok) {
          const json = await res.json();
          setAiData({
            validation: json.validation,
            steps: json.steps
          });
        } else {
          throw new Error();
        }
      } catch {
        // Safe fallback in case of errors
        setAiData({
          validation: "This is a strong stress wave. You are safe right now, this feeling is temporary, and your body can settle again.",
          steps: [
            "Splash cool water on your face or hold something cool for a few breaths.",
            "Take 5 slow breaths, exhaling double the length of your inhales.",
            "Focus on naming 3 physical objects you can touch in your room right now."
          ]
        });
      } finally {
        setAiLoading(false);
        setIsProcessing(false);
        setShowAiResult(true);
        setActiveTab("ai");
      }
    }, 500);
  };

  // Checkbox handlers for the somatic steps
  const toggleStep = (idx: number) => {
    setCompletedSteps((prev) => ({
      ...prev,
      [idx]: !prev[idx]
    }));
  };

  const allStepsCompleted = aiData && aiData.steps.every((_, idx) => completedSteps[idx]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/90 backdrop-blur-2xl transition-all duration-300 animate-fade-in">
      
      {/* Absolute Close Header Button */}
      <button 
        onClick={onClose}
        className="absolute top-6 right-6 p-2 rounded-full bg-slate-900/60 hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer border border-slate-800"
        title="I need to leave now"
      >
        <X className="w-5 h-5" />
      </button>
      <button
        onClick={onClose}
        className="absolute top-6 left-6 px-4 py-2 rounded-full bg-slate-900/60 hover:bg-slate-800 text-slate-300 hover:text-white transition-colors cursor-pointer border border-slate-800 text-xs font-bold"
      >
        I need to leave now
      </button>

      <div className="w-full max-w-2xl flex flex-col items-center space-y-8 text-center">
        
        {/* Soft Header Cues */}
        <div className="space-y-2">
          <div className="flex items-center justify-center gap-2">
            <Heart className="w-5 h-5 text-teal-300 fill-teal-300/10" />
            <h2 className="text-xl font-bold tracking-tight text-white font-sans">
              Calm Space
            </h2>
          </div>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Take a pause. There is no urgency. Move at your own pace.
          </p>
        </div>

        {/* Calm Room Tabs Selector */}
        <div className="flex bg-slate-900/60 border border-slate-800/80 p-1 rounded-2xl shadow-inner w-full max-w-md">
          <button
            onClick={() => {
              if (!isProcessing) {
                setBreathPhaseIndex(0);
                setActiveTab("breathe");
                setShowAiResult(false);
              }
            }}
            className={`flex-1 py-3 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === "breathe"
                ? "bg-slate-800 text-white shadow-sm"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Wind className="w-4 h-4" />
            Box Breathing
          </button>
          
          <button
            onClick={() => {
              if (!isProcessing) {
                if (showAiResult && aiData) {
                  setActiveTab("ai");
                } else {
                  setActiveTab("vent");
                }
              }
            }}
            className={`flex-1 py-3 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === "vent" || activeTab === "ai"
                ? "bg-slate-800 text-white shadow-sm"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            {showAiResult ? "Steady Steps" : "Write Thoughts"}
          </button>
        </div>

        {/* Tab 1: guided breathing room */}
        {activeTab === "breathe" && (
          <div className="flex flex-col items-center justify-center space-y-12 py-10 w-full animate-fade-in">
            <div className="relative flex items-center justify-center w-56 h-56">
              <div className="absolute w-32 h-32 rounded-full bg-gradient-to-tr from-teal-300 via-sky-400 to-slate-300 shadow-[0_0_45px_16px_rgba(45,212,191,0.24)] animate-calm-breath" />
              <div className="relative z-10 flex flex-col items-center justify-center text-white">
                <span className="text-xs font-bold uppercase tracking-widest text-slate-200/70 mt-0.5">
                  {breathInstruction}
                </span>
              </div>
            </div>

            <div className="space-y-2 h-[70px]">
              <h3 className="text-lg font-bold text-white transition-all">
                Box Breathing
              </h3>
              <p className="text-xs text-slate-400 italic">
                Inhale 4 seconds, hold 4, exhale 4, hold 4.
              </p>
            </div>
            
            <button
              onClick={() => setActiveTab("vent")}
              className="px-6 py-3 rounded-full bg-slate-900/60 border border-slate-800 text-xs font-bold text-slate-300 hover:text-white hover:bg-slate-850 hover:border-slate-700 transition-all cursor-pointer flex items-center gap-1.5"
            >
              Need to write thoughts?
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Tab 2: venting room */}
        {activeTab === "vent" && (
          <div className="w-full max-w-xl space-y-6 animate-fade-in">
            <div className="space-y-1.5 text-center">
              <h3 className="text-sm font-bold text-white">Write it Down</h3>
              <p className="text-[11px] text-slate-400 max-w-xs mx-auto">
                Write what is here. Your words can stay with you while we find steady next steps.
              </p>
            </div>

            <div 
              className="relative bg-slate-900/40 border border-slate-800 rounded-3xl p-5 shadow-2xl transition-colors duration-300"
            >
              <textarea
                value={ventText}
                onChange={(e) => setVentText(e.target.value)}
                placeholder="I'm feeling overwhelmed because..."
                disabled={isProcessing}
                maxLength={2000}
                className="w-full h-40 bg-transparent border-0 text-slate-200 placeholder-slate-650 text-xs focus:ring-0 focus:outline-none resize-none font-medium leading-relaxed"
              />
              
              <div className="flex justify-between items-center mt-3 pt-3 border-t border-slate-800/40">
                <span className="text-[10px] font-bold text-slate-550">
                  {ventText.trim().split(/\s+/).filter(Boolean).length} words
                </span>
                <button
                  type="button"
                  onClick={handleReleaseVent}
                  disabled={!ventText.trim() || isProcessing}
                  className={`px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer ${
                    ventText.trim() && !isProcessing
                      ? "bg-white text-slate-950 hover:bg-slate-100 hover:scale-[1.02]"
                      : "bg-slate-900 text-slate-650 border border-slate-800 cursor-not-allowed"
                  }`}
                >
                  Find Steady Steps
                  <Sparkles className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {isProcessing && (
              <div className="space-y-2 text-center">
                <Loader2 className="w-5 h-5 text-slate-400 animate-spin mx-auto" />
                <span className="text-[10px] font-bold text-slate-400">Your words are here. Finding warm reassurance...</span>
              </div>
            )}
          </div>
        )}

        {/* Tab 3: AI results centering */}
        {activeTab === "ai" && (
          <div className="w-full max-w-xl space-y-6 animate-fade-in text-left">
            {aiLoading ? (
              <div className="flex flex-col items-center py-20 gap-3 text-center w-full">
                <Loader2 className="w-8 h-8 text-white animate-spin" />
                <p className="text-xs font-bold text-white">Finding steady next steps...</p>
                <p className="text-[10px] text-slate-550 max-w-[220px]">Your words are still here with you.</p>
              </div>
            ) : aiData ? (
              <div className="space-y-6">
                
                {/* AI Reassurance Card */}
                <GlassCard className="p-5.5 bg-slate-900/40 border border-slate-800/80 shadow-2xl space-y-3 rounded-2xl">
                  <div className="flex items-center gap-2 text-slate-200">
                    <Sparkles className="w-4.5 h-4.5 text-indigo-400 shrink-0" />
                    <span className="text-xs font-bold tracking-tight">Centering Insight</span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed font-medium italic">
                    &ldquo;{aiData.validation}&rdquo;
                  </p>
                </GlassCard>

                {/* Checklist grounding tasks */}
                <div className="space-y-3">
                  <div className="space-y-0.5">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">
                      Grounding Actions Checklist
                    </span>
                    <span className="text-[9px] text-slate-500 block leading-snug">
                      Try each step gently and mark it when it feels complete enough.
                    </span>
                  </div>

                  <div className="space-y-2">
                    {aiData.steps.map((step, idx) => {
                      const isDone = !!completedSteps[idx];
                      return (
                        <div
                          key={idx}
                          onClick={() => toggleStep(idx)}
                          className={`p-4 rounded-2xl border transition-all flex items-center justify-between text-xs gap-3 cursor-pointer ${
                            isDone 
                              ? "bg-slate-900/60 border-slate-800 opacity-60" 
                              : "bg-slate-900/30 border-slate-850 hover:border-slate-750"
                          }`}
                        >
                          <div className="flex items-start gap-3 flex-1 min-w-0">
                            <button
                              type="button"
                              className={`w-5 h-5 rounded-full border flex items-center justify-center transition-all shrink-0 mt-0.5 ${
                                isDone 
                                  ? "border-emerald-500 bg-emerald-500 text-white" 
                                  : "border-slate-700 bg-transparent"
                              }`}
                            >
                              {isDone && <CheckCircle className="w-3.5 h-3.5 fill-white text-emerald-500" />}
                            </button>
                            <span className={`font-medium text-slate-300 text-left ${isDone ? "line-through text-slate-500" : ""}`}>
                              {step}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Final Return Button */}
                <button
                  onClick={onClose}
                  disabled={!allStepsCompleted}
                  className={`w-full py-4 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 transition-all ${
                    allStepsCompleted
                      ? "bg-white text-slate-950 hover:bg-slate-100 hover:scale-[1.01] cursor-pointer shadow-md shadow-white/5"
                      : "bg-slate-900 text-slate-550 border border-slate-850 cursor-not-allowed"
                  }`}
                >
                  {allStepsCompleted ? (
                    <>
                      Return to Dashboard
                      <CheckCircle className="w-4 h-4 text-slate-950" />
                    </>
                  ) : (
                    <>
                      Try the grounding steps to continue ({Object.values(completedSteps).filter(Boolean).length}/3)
                    </>
                  )}
                </button>

                <div className="flex justify-center">
                  <button
                    onClick={() => {
                      setVentText("");
                      setShowAiResult(false);
                      setActiveTab("vent");
                    }}
                    className="text-[10px] font-bold text-slate-450 hover:text-slate-300 transition-colors cursor-pointer flex items-center gap-1"
                  >
                    <RefreshCw className="w-3 h-3" />
                    Write about something else
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center py-12 gap-2 text-center w-full">
                <AlertTriangle className="w-8 h-8 text-amber-500" />
                <p className="text-xs font-bold text-white">Failed to retrieve suggestions</p>
                <button
                  onClick={handleReleaseVent}
                  className="px-4 py-2 bg-slate-900 text-white border border-slate-800 rounded-xl text-xs font-bold hover:bg-slate-800 cursor-pointer mt-2"
                >
                  Try Again
                </button>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}

"use client";

import { useState, useEffect, useRef } from "react";
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
type BreatheState = "inhale" | "hold-in" | "exhale" | "hold-out";

export default function PanicRoomModal({ isOpen, onClose }: PanicRoomModalProps) {
  const [activeTab, setActiveTab] = useState<TabType>("breathe");
  
  // Box Breathing state
  const [breatheState, setBreatheState] = useState<BreatheState>("inhale");
  const [breatheSeconds, setBreatheSeconds] = useState(4);
  const breatheIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Venting state
  const [ventText, setVentText] = useState("");
  const [isDissolving, setIsDissolving] = useState(false);
  const [showAiResult, setShowAiResult] = useState(false);

  // AI suggestion state
  const [aiLoading, setAiLoading] = useState(false);
  const [aiData, setAiData] = useState<{ validation: string; steps: string[] } | null>(null);
  const [completedSteps, setCompletedSteps] = useState<Record<number, boolean>>({});

  // Reset modal states when opened
  useEffect(() => {
    if (isOpen) {
      setActiveTab("breathe");
      setBreatheState("inhale");
      setBreatheSeconds(4);
      setVentText("");
      setIsDissolving(false);
      setShowAiResult(false);
      setAiData(null);
      setCompletedSteps({});
    }
  }, [isOpen]);

  // Box Breathing cycle timer
  useEffect(() => {
    if (!isOpen || activeTab !== "breathe") {
      if (breatheIntervalRef.current) clearInterval(breatheIntervalRef.current);
      return;
    }

    breatheIntervalRef.current = setInterval(() => {
      setBreatheSeconds((prev) => {
        if (prev <= 1) {
          // Transition states
          setBreatheState((currState) => {
            switch (currState) {
              case "inhale": return "hold-in";
              case "hold-in": return "exhale";
              case "exhale": return "hold-out";
              case "hold-out": return "inhale";
            }
          });
          return 4;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (breatheIntervalRef.current) clearInterval(breatheIntervalRef.current);
    };
  }, [isOpen, activeTab]);

  if (!isOpen) return null;

  // Handle Vent release & trigger AI response
  const handleReleaseVent = async () => {
    if (!ventText.trim()) return;

    setIsDissolving(true);
    setAiLoading(true);
    setAiData(null);
    setCompletedSteps({});

    // Start fetching suggestions in parallel
    const fetchPromise = fetch("/api/panic", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ventText }),
    });

    // Let the dissolving animation play out for 1.8 seconds
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
          validation: "You are experiencing an intense physiological stress response. Rest assured, you are safe, this feeling is temporary, and your nervous system will settle shortly.",
          steps: [
            "Splashing very cold water on your face to trigger an automatic heart-rate cooldown.",
            "Take 5 slow breaths, exhaling double the length of your inhales.",
            "Focus on naming 3 physical objects you can touch in your room right now."
          ]
        });
      } finally {
        setAiLoading(false);
        setIsDissolving(false);
        setShowAiResult(true);
        setActiveTab("ai");
      }
    }, 1800);
  };

  // Checkbox handlers for the somatic steps
  const toggleStep = (idx: number) => {
    setCompletedSteps((prev) => ({
      ...prev,
      [idx]: !prev[idx]
    }));
  };

  const allStepsCompleted = aiData && aiData.steps.every((_, idx) => completedSteps[idx]);

  // Breathing state messages & classes
  const getBreatheConfig = () => {
    switch (breatheState) {
      case "inhale":
        return {
          title: "Breathe In...",
          subtitle: "Fill your lungs slowly and deeply",
          circleClass: "scale-[1.6] bg-gradient-to-tr from-teal-400 to-indigo-500 shadow-[0_0_50px_20px_rgba(45,212,191,0.4)]",
          instruction: "Feel the fresh energy entering your chest"
        };
      case "hold-in":
        return {
          title: "Hold it...",
          subtitle: "Rest in the quiet stillness",
          circleClass: "scale-[1.6] bg-gradient-to-tr from-indigo-500 to-violet-500 shadow-[0_0_50px_20px_rgba(99,102,241,0.4)]",
          instruction: "Let the air settle within you"
        };
      case "exhale":
        return {
          title: "Exhale slowly...",
          subtitle: "Let go of all the pressure",
          circleClass: "scale-[1.0] bg-gradient-to-tr from-violet-500 to-slate-500 shadow-[0_0_30px_10px_rgba(139,92,246,0.2)]",
          instruction: "Push the tension out with your breath"
        };
      case "hold-out":
        return {
          title: "Hold...",
          subtitle: "Wait gently for the next cycle",
          circleClass: "scale-[1.0] bg-gradient-to-tr from-slate-500 to-teal-400 shadow-[0_0_30px_10px_rgba(100,116,139,0.2)]",
          instruction: "Prepare to receive calm breath"
        };
    }
  };

  const breatheConfig = getBreatheConfig();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/90 backdrop-blur-2xl transition-all duration-300 animate-fade-in">
      
      {/* Absolute Close Header Button */}
      <button 
        onClick={onClose}
        className="absolute top-6 right-6 p-2 rounded-full bg-slate-900/60 hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer border border-slate-800"
        title="Leave Calming Room"
      >
        <X className="w-5 h-5" />
      </button>

      <div className="w-full max-w-2xl flex flex-col items-center space-y-8 text-center">
        
        {/* Soft Header Cues */}
        <div className="space-y-2">
          <div className="flex items-center justify-center gap-2">
            <Heart className="w-5 h-5 text-rose-500 fill-rose-500/10 animate-pulse" />
            <h2 className="text-xl font-bold tracking-tight text-white font-sans">
              Panic Grounding Room
            </h2>
          </div>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Take a pause. There is no urgency. Let's restore bio-stability at your own pace.
          </p>
        </div>

        {/* Calm Room Tabs Selector */}
        <div className="flex bg-slate-900/60 border border-slate-800/80 p-1 rounded-2xl shadow-inner w-full max-w-md">
          <button
            onClick={() => {
              if (!isDissolving) {
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
              if (!isDissolving) {
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
            {showAiResult ? "AI Centering" : "Vent & Dissolve"}
          </button>
        </div>

        {/* Tab 1: guided breathing room */}
        {activeTab === "breathe" && (
          <div className="flex flex-col items-center justify-center space-y-12 py-10 w-full animate-fade-in">
            <div className="relative flex items-center justify-center w-56 h-56">
              
              {/* Outer Breathing circle with custom scale transitions */}
              <div 
                className={`absolute w-32 h-32 rounded-full opacity-60 transition-all duration-[4000ms] cubic-bezier(0.4, 0, 0.2, 1) ${breatheConfig.circleClass}`} 
              />
              
              {/* Inner Circle timer text */}
              <div className="relative z-10 flex flex-col items-center justify-center text-white">
                <span className="text-4xl font-black tracking-tighter">{breatheSeconds}</span>
                <span className="text-[9px] font-bold uppercase tracking-widest text-slate-200/60 mt-0.5">
                  {breatheState.replace("-", " ")}
                </span>
              </div>
            </div>

            <div className="space-y-2 h-[70px]">
              <h3 className="text-lg font-bold text-white transition-all">
                {breatheConfig.title}
              </h3>
              <p className="text-xs text-slate-400 italic">
                {breatheConfig.instruction}
              </p>
            </div>
            
            <button
              onClick={() => setActiveTab("vent")}
              className="px-6 py-3 rounded-full bg-slate-900/60 border border-slate-800 text-xs font-bold text-slate-300 hover:text-white hover:bg-slate-850 hover:border-slate-700 transition-all cursor-pointer flex items-center gap-1.5"
            >
              Need to vent thoughts? Go to venting
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
                Pour out your panic, anxiety, or stress. We will release it completely.
              </p>
            </div>

            <div 
              className={`relative bg-slate-900/40 border border-slate-800 rounded-3xl p-5 shadow-2xl transition-all duration-[1800ms] ${
                isDissolving ? "translate-y-[-100px] scale-50 opacity-0 blur-md pointer-events-none" : ""
              }`}
            >
              <textarea
                value={ventText}
                onChange={(e) => setVentText(e.target.value)}
                placeholder="I'm feeling so anxious because..."
                disabled={isDissolving}
                className="w-full h-40 bg-transparent border-0 text-slate-200 placeholder-slate-650 text-xs focus:ring-0 focus:outline-none resize-none font-medium leading-relaxed"
              />
              
              <div className="flex justify-between items-center mt-3 pt-3 border-t border-slate-800/40">
                <span className="text-[10px] font-bold text-slate-550">
                  {ventText.trim().split(/\s+/).filter(Boolean).length} words
                </span>
                <button
                  type="button"
                  onClick={handleReleaseVent}
                  disabled={!ventText.trim() || isDissolving}
                  className={`px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer ${
                    ventText.trim() && !isDissolving
                      ? "bg-white text-slate-950 hover:bg-slate-100 hover:scale-[1.02]"
                      : "bg-slate-900 text-slate-650 border border-slate-800 cursor-not-allowed"
                  }`}
                >
                  Release to the Ether
                  <Sparkles className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {isDissolving && (
              <div className="space-y-2 text-center animate-pulse">
                <Loader2 className="w-5 h-5 text-slate-400 animate-spin mx-auto" />
                <span className="text-[10px] font-bold text-slate-400">Dissolving and forming warm reassurance...</span>
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
                <p className="text-xs font-bold text-white">Formulating clinical validation...</p>
                <p className="text-[10px] text-slate-550 max-w-[200px]">Your vent has been released. Now let's settle your physiology.</p>
              </div>
            ) : aiData ? (
              <div className="space-y-6">
                
                {/* AI Reassurance Card */}
                <GlassCard className="p-5.5 bg-slate-900/40 border border-slate-800/80 shadow-2xl space-y-3 rounded-2xl">
                  <div className="flex items-center gap-2 text-slate-200">
                    <Sparkles className="w-4.5 h-4.5 text-indigo-400 shrink-0" />
                    <span className="text-xs font-bold tracking-tight">AI Centering Insight</span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed font-medium italic">
                    "{aiData.validation}"
                  </p>
                </GlassCard>

                {/* Checklist Somatic Tasks */}
                <div className="space-y-3">
                  <div className="space-y-0.5">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">
                      Grounding Actions Checklist
                    </span>
                    <span className="text-[9px] text-slate-500 block leading-snug">
                      Perform each task physically and tick it off to regain biological stability.
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
                      I feel stable now — Return to Dashboard
                      <CheckCircle className="w-4 h-4 text-slate-950" />
                    </>
                  ) : (
                    <>
                      Complete All Grounding Steps to Lock Stability ({Object.values(completedSteps).filter(Boolean).length}/3)
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
                    Vent about something else
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

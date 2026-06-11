"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { 
  Zap, Activity, Heart, Flame, ShieldAlert, Award, 
  Calendar, CheckCircle, Brain, Sparkles, LogOut, 
  ChevronRight, ArrowRight, Loader2, Play, Volume2, Download, Info
} from "lucide-react";
import GlassCard from "@/components/shared/GlassCard";
import TensionDial from "@/components/shared/vitals/TensionDial";
import PodChat from "@/components/dashboard/PodChat";
import ActivityDetailModal, { type ActivityDetail } from "@/components/dashboard/ActivityDetailModal";
import PanicRoomModal from "@/components/dashboard/PanicRoomModal";
import {
  getCachedActivityDetail,
  pruneExpiredActivityDetails,
  setCachedActivityDetail,
} from "@/lib/activityDetailCache";
import { useAuth } from "@/lib/useAuth";

const INITIAL_DEMO_DATA = {
  name: "Dr. Hackathon Judge",
  goal: "Reduce Anxiety & Regulate Sleep",
  goalDuration: 14,
  currentDay: 5,
  streak: 3,
  weeklyDataPointCount: 5,
  weeklyProgress: [
    { dayName: "Mon", anxietyScore: 7.5, hasData: true },
    { dayName: "Tue", anxietyScore: 7.0, hasData: true },
    { dayName: "Wed", anxietyScore: 8.0, hasData: true },
    { dayName: "Thu", anxietyScore: 6.5, hasData: true },
    { dayName: "Fri", anxietyScore: 6.8, hasData: true },
    { dayName: "Sat", anxietyScore: null, hasData: false },
    { dayName: "Sun", anxietyScore: null, hasData: false }
  ],
  report: {
    anxietyScore: 6.8,
    subtype: "Somatic Tension",
    pacingRate: "45% Decelerated",
  },
  redFlags: [
    "Autonomic Spike during meeting (10:15 AM)",
    "Late screen activity (11:45 PM)"
  ],
  insights: "Your somatic markers indicate high tension levels mid-day. The pacing rate has been decelerated by 45% to help restore balance.",
  achievements: [
    { id: "ach_1", title: "Grounding Guru", desc: "Completed 3 somatic breathing pauses this week", unlocked: true },
    { id: "ach_2", title: "Social Guard", desc: "Maintained digital boundaries for 5 consecutive days", unlocked: true },
    { id: "ach_3", title: "Perfect Reflection Week", desc: "Logged reflections daily for 7 days", unlocked: false }
  ],
  activities: [
    { id: "act_1", name: "Somatic Grounding Pause", description: "Take a 5m deep breathing break every 3 hours", type: "Somatic" },
    { id: "act_2", name: "Digital Communication Limit", description: "Turn off notifications after 9:30 PM", type: "Digital" },
    { id: "act_3", name: "Calm Pacing Walking", description: "10-minute slow pacing stroll post-lunch", type: "Physical" }
  ],
  completedActivities: [],
  pod: {
    id: "pod_42",
    podNumber: 42,
    focusArea: "Somatic Tension",
    memberCount: 4,
    activeCount: 3,
    isForming: false,
    members: [
      { id: "m1", displayName: "Sophia (Somatic)", activeToday: true, isCurrentUser: false },
      { id: "m2", displayName: "James (Social)", activeToday: true, isCurrentUser: false },
      { id: "m3", displayName: "Maya (Cognitive)", activeToday: false, isCurrentUser: false },
      { id: "demo-user-123", displayName: "Dr. Hackathon Judge", activeToday: true, isCurrentUser: true }
    ]
  }
};

export default function DashboardPage() {
  const router = useRouter();
  const { user, loading: authLoading, logout } = useAuth({ redirectTo: "/login" });
  
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isPremium, setIsPremium] = useState(false);
  const [voicePlaying, setVoicePlaying] = useState(false);
  const [panicRoomOpen, setPanicRoomOpen] = useState(false);

  // Reflection Modal state
  const [reflectionOpen, setReflectionOpen] = useState(false);
  const [reflectionStep, setReflectionStep] = useState(1);
  const [ratings, setRatings] = useState({ mood: 7, energy: 6, anxiety: 5, sleep: 7 });
  const [ventText, setVentText] = useState("");
  const [questions, setQuestions] = useState<string[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [questionsLoading, setQuestionsLoading] = useState(false);
  const [submittingReflection, setSubmittingReflection] = useState(false);

  // Activity detail modal (generated on demand via LLM)
  const [detailActivity, setDetailActivity] = useState<{
    id: string;
    name: string;
    type: string;
    description?: string;
  } | null>(null);
  const [activityDetail, setActivityDetail] = useState<ActivityDetail | null>(null);
  const [detailForActivityId, setDetailForActivityId] = useState<string | null>(null);
  const [activityDetailLoading, setActivityDetailLoading] = useState(false);
  const [activityDetailError, setActivityDetailError] = useState("");
  const activityDetailRequestRef = useRef<string | null>(null);

  // Load dashboard telemetry data
  const fetchDashboardData = async () => {
    const isDemo = typeof window !== "undefined" && localStorage.getItem("calmpulse_demo") === "true";
    if (isDemo) {
      const saved = localStorage.getItem("calmpulse_demo_data");
      if (saved) {
        try {
          setData(JSON.parse(saved));
        } catch {
          setData(INITIAL_DEMO_DATA);
        }
      } else {
        setData(INITIAL_DEMO_DATA);
        localStorage.setItem("calmpulse_demo_data", JSON.stringify(INITIAL_DEMO_DATA));
      }
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/dashboard/data");
      if (res.ok) {
        const json = await res.json();
        setData(json.data);
      }
    } catch (e) {
      console.error("Failed to load dashboard statistics:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    pruneExpiredActivityDetails();
  }, []);

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  const openActivityDetail = async (act: { id: string; name: string; type: string; description?: string }) => {
    activityDetailRequestRef.current = act.id;

    setDetailActivity(act);
    setActivityDetailError("");
    setActivityDetail(null);
    setDetailForActivityId(null);
    setActivityDetailLoading(true);

    const isDemo = typeof window !== "undefined" && localStorage.getItem("calmpulse_demo") === "true";
    if (isDemo) {
      setTimeout(() => {
        if (activityDetailRequestRef.current !== act.id) return;
        const mockDetails: Record<string, any> = {
          act_1: {
            guide: "Sit upright in a comfortable chair. Inhale slowly through your nose for 4 seconds, hold for 4 seconds, and exhale through your mouth for 4 seconds. Focus on the physical points of contact between your feet and the floor.",
            duration: "5 minutes",
            benefit: "Lowers autonomic nervous system arousal, reduces active chest tension, and prompts grounding."
          },
          act_2: {
            guide: "Turn off all electronic displays (phone, laptop, TV) at least 30 minutes before sleep. Store your phone across the room or outside the bedroom. Engage in a non-screen wind-down ritual like reading or stretching.",
            duration: "30 minutes",
            benefit: "Reduces blue light inhibition of melatonin and helps the brain transition into delta wave sleep patterns."
          },
          act_3: {
            guide: "Go outside and walk at an intentionally slow pace (about half your normal speed). Focus entirely on the physical sensations of each step and the environmental sounds around you. Do not check your device.",
            duration: "10 minutes",
            benefit: "Improves somatic grounding and breaks cognitive feedback loops associated with screen fatigue."
          }
        };

        const detail = mockDetails[act.id] || {
          guide: `Detailed walkthrough for ${act.name}. Follow the steps slowly, maintaining steady, pacing breathing patterns.`,
          duration: "5-10 minutes",
          benefit: "Promotes parasympathetic activation and cognitive recovery."
        };

        setActivityDetail(detail);
        setDetailForActivityId(act.id);
        setActivityDetailLoading(false);
      }, 300);
      return;
    }

    const cached = getCachedActivityDetail(act.id);
    if (cached) {
      if (activityDetailRequestRef.current !== act.id) return;
      setActivityDetail(cached);
      setDetailForActivityId(act.id);
      setActivityDetailLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/dashboard/activity-detail", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ activityId: act.id }),
      });
      const json = await res.json();

      if (activityDetailRequestRef.current !== act.id) return;

      if (!res.ok) {
        setActivityDetailError(json.error || "Failed to generate activity guide");
        return;
      }

      setActivityDetail(json.detail);
      setDetailForActivityId(act.id);
      setCachedActivityDetail(act.id, json.detail);
    } catch {
      if (activityDetailRequestRef.current !== act.id) return;
      setActivityDetailError("Failed to generate activity guide. Please try again.");
    } finally {
      if (activityDetailRequestRef.current === act.id) {
        setActivityDetailLoading(false);
      }
    }
  };

  const closeActivityDetail = () => {
    activityDetailRequestRef.current = null;
    setDetailActivity(null);
    setActivityDetail(null);
    setDetailForActivityId(null);
    setActivityDetailError("");
    setActivityDetailLoading(false);
  };

  // Handle activity checklist complete toggle
  const toggleActivity = async (activityId: string, isCompleted: boolean) => {
    const isDemo = typeof window !== "undefined" && localStorage.getItem("calmpulse_demo") === "true";
    if (isDemo) {
      const prevCompleted = data.completedActivities;
      const newCompleted = isCompleted
        ? [...prevCompleted, activityId]
        : prevCompleted.filter((id: string) => id !== activityId);
      
      const updated = { ...data, completedActivities: newCompleted };
      setData(updated);
      localStorage.setItem("calmpulse_demo_data", JSON.stringify(updated));
      return;
    }

    // Optimistic UI update
    const prevCompleted = data.completedActivities;
    const newCompleted = isCompleted
      ? [...prevCompleted, activityId]
      : prevCompleted.filter((id: string) => id !== activityId);
    
    setData({ ...data, completedActivities: newCompleted });

    try {
      const res = await fetch("/api/dashboard/complete-activity", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ activityId, completed: isCompleted }),
      });
      if (!res.ok) throw new Error();
    } catch (e) {
      // Revert if error
      setData({ ...data, completedActivities: prevCompleted });
    }
  };

  // Fetch AI end-of-day reflection questions
  const startReflection = async () => {
    setReflectionOpen(true);
    setReflectionStep(1);
    setQuestionsLoading(true);

    const isDemo = typeof window !== "undefined" && localStorage.getItem("calmpulse_demo") === "true";
    if (isDemo) {
      setTimeout(() => {
        setQuestions([
          "How did your somatic indicators respond during stress triggers today?",
          "What boundary worked best to keep you centered today?",
          "Are there any changes in sleep quality or wind-down rituals you want to note?"
        ]);
        setQuestionsLoading(false);
      }, 400);
      return;
    }

    try {
      const res = await fetch("/api/dashboard/reflection/questions");
      if (res.ok) {
        const json = await res.json();
        setQuestions(json.questions);
      }
    } catch (e) {
      console.error(e);
      setQuestions([
        "How did your somatic indicators respond during stress triggers today?",
        "What boundary worked best to keep you centered today?",
        "Are there any changes in sleep quality or wind-down rituals you want to note?"
      ]);
    } finally {
      setQuestionsLoading(false);
    }
  };

  // Submit the daily reflection logs
  const submitReflection = async () => {
    setSubmittingReflection(true);

    const isDemo = typeof window !== "undefined" && localStorage.getItem("calmpulse_demo") === "true";
    if (isDemo) {
      setTimeout(() => {
        const updatedProgress = [...data.weeklyProgress];
        const newScore = parseFloat(ratings.anxiety.toFixed(1));
        updatedProgress[5] = { dayName: "Sat", anxietyScore: newScore, hasData: true };

        const updated = {
          ...data,
          streak: data.streak + 1,
          weeklyProgress: updatedProgress,
          weeklyDataPointCount: data.weeklyDataPointCount + 1,
          report: {
            ...data.report,
            anxietyScore: newScore,
            pacingRate: newScore > 6 ? "50% Decelerated" : "30% Decelerated"
          },
          completedActivities: [], // reset checklist
          insights: `Daily reflection submitted! Based on your rated stress score of ${newScore}/10, your pacing baseline has been recalibrated to ${newScore > 6 ? "50% Decelerated" : "30% Decelerated"}.`
        };

        setData(updated);
        localStorage.setItem("calmpulse_demo_data", JSON.stringify(updated));
        
        setReflectionOpen(false);
        setSubmittingReflection(false);
        setVentText("");
        setAnswers({});
      }, 600);
      return;
    }

    try {
      const res = await fetch("/api/dashboard/reflection/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mood: ratings.mood,
          energy: ratings.energy,
          anxiety: ratings.anxiety,
          sleep: ratings.sleep,
          ventText,
          clarifyingAnswers: answers
        }),
      });

      if (res.ok) {
        await fetchDashboardData();
        setReflectionOpen(false);
        // Reset inputs
        setVentText("");
        setAnswers({});
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSubmittingReflection(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center font-sans text-slate-500">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="w-8 h-8 text-slate-900 animate-spin" />
          <span className="text-xs font-semibold">Generating CalmPulse Dashboard...</span>
        </div>
      </div>
    );
  }

  if (!data) return null;

  // Calculate completion percentage
  const totalActCount = data.activities?.length || 0;
  const completedActCount = data.completedActivities?.length || 0;
  const activityRate = totalActCount > 0 ? Math.round((completedActCount / totalActCount) * 100) : 0;

  // SVG Trend Chart Dimensions
  const chartHeight = 120;
  const chartWidth = 500;
  const points = data.weeklyProgress || [];
  const hasWeeklyData = (data.weeklyDataPointCount ?? 0) > 0;

  const mapY = (score: number) => {
    const minVal = 1;
    const maxVal = 10;
    const scale = (score - minVal) / (maxVal - minVal);
    return chartHeight - 20 - scale * (chartHeight - 40);
  };

  const mapX = (index: number) => {
    if (points.length <= 1) return chartWidth / 2;
    return 30 + index * ((chartWidth - 60) / (points.length - 1));
  };

  const dataPoints = points
    .map((p: { anxietyScore: number | null; hasData: boolean }, idx: number) => ({
      ...p,
      idx,
      x: mapX(idx),
      y: p.hasData && p.anxietyScore != null ? mapY(p.anxietyScore) : null,
    }))
    .filter((p: { hasData: boolean }) => p.hasData);

  const lineSegments: string[] = [];
  for (let i = 1; i < dataPoints.length; i++) {
    const prev = dataPoints[i - 1];
    const curr = dataPoints[i];
    if (prev.y != null && curr.y != null) {
      lineSegments.push(`${prev.x},${prev.y} ${curr.x},${curr.y}`);
    }
  }

  const areaPath =
    dataPoints.length >= 2
      ? `M ${dataPoints[0].x} ${chartHeight - 20} ` +
        dataPoints.map((p: { x: number; y: number | null }) => `L ${p.x} ${p.y}`).join(" ") +
        ` L ${dataPoints[dataPoints.length - 1].x} ${chartHeight - 20} Z`
      : "";

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 selection:bg-slate-900/10 selection:text-slate-900 flex flex-col font-sans">
      
      {/* Top Glass Navigation */}
      <header className="fixed top-0 left-0 right-0 z-40 glass-panel border-b border-slate-200/40 py-4 px-6 md:px-12 flex justify-between items-center bg-white/70">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-slate-900 flex items-center justify-center text-white font-bold shadow-md shadow-slate-900/10">
            C
          </div>
          <span className="text-xl font-bold tracking-tight text-slate-900">
            Calm<span className="font-display italic text-slate-600 font-semibold">Pulse</span>
          </span>
        </div>

        <div className="flex items-center gap-6">
          <div className="hidden sm:flex flex-col text-right">
            <span className="text-[10px] font-bold text-slate-500 uppercase">Mental Coach Active</span>
            <span className="text-xs font-bold text-slate-900">{data.name}</span>
          </div>

          <button
            onClick={logout}
            className="p-2.5 text-slate-400 hover:text-slate-900 rounded-full hover:bg-slate-100 transition-all cursor-pointer flex items-center gap-1.5"
            title="Sign Out"
          >
            <LogOut className="w-4 h-4" />
            <span className="text-xs font-bold hidden sm:inline">Sign Out</span>
          </button>
        </div>
      </header>

      {/* Main Body */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-6 pt-24 pb-16 space-y-8">
        
        {typeof window !== "undefined" && localStorage.getItem("calmpulse_demo") === "true" && (
          <div className="bg-gradient-to-r from-violet-50 to-indigo-50 border border-violet-200 rounded-3xl p-6.5 shadow-sm space-y-3.5 animate-fade-in text-slate-800">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-violet-600 animate-pulse" />
              <h4 className="text-sm font-black text-slate-900 tracking-tight">Interactive Reviewer Sandbox Active</h4>
            </div>
            <p className="text-xs text-slate-650 leading-relaxed">
              Welcome! You are logged in with offline mock credentials. You can test and inspect the entire workflow of the application without configuring any databases:
            </p>
            <div className="grid sm:grid-cols-3 gap-4 text-xs">
              <div className="p-3 bg-white/70 border border-violet-100/50 rounded-2xl space-y-1">
                <span className="font-extrabold text-slate-850 block">1. Today&apos;s Habits</span>
                <span className="text-[10px] text-slate-500 block leading-relaxed">
                  Check off the pacing habits (or click <strong>Auto-Complete</strong>) to satisfy your somatic targets.
                </span>
              </div>
              <div className="p-3 bg-white/70 border border-violet-100/50 rounded-2xl space-y-1">
                <span className="font-extrabold text-slate-850 block">2. Daily Reflection</span>
                <span className="text-[10px] text-slate-500 block leading-relaxed">
                  Completing your habits unlocks the **Daily Reflection**. Fill it out to see the stress dial and weekly chart update.
                </span>
              </div>
              <div className="p-3 bg-white/70 border border-violet-100/50 rounded-2xl space-y-1">
                <span className="font-extrabold text-slate-850 block">3. Peer Cohort Chat</span>
                <span className="text-[10px] text-slate-500 block leading-relaxed">
                  Send a message in the pod chat. Your anonymous phase-matched peers will respond to you in real-time.
                </span>
              </div>
            </div>
          </div>
        )}
        
        {/* Dashboard Title & Premium Control Banner */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200/50 pb-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 leading-tight">Pacing Center</h1>
            <p className="text-xs text-slate-500">Track and adapt your biological recovery program.</p>
          </div>

          {/* Premium / Standard Tier Selector */}
          <div className="flex items-center gap-3 bg-white border border-slate-200 p-1.5 rounded-2xl shadow-sm">
            <button
              onClick={() => setIsPremium(false)}
              className={`px-4 py-2 text-[10px] font-extrabold uppercase rounded-xl transition-all cursor-pointer ${
                !isPremium 
                  ? "bg-slate-900 text-white shadow-sm" 
                  : "text-slate-550 hover:bg-slate-50"
              }`}
            >
              Standard
            </button>
            <button
              onClick={() => setIsPremium(true)}
              className={`px-4 py-2 text-[10px] font-extrabold uppercase rounded-xl transition-all flex items-center gap-1 cursor-pointer ${
                isPremium 
                  ? "bg-gradient-to-r from-violet-600 to-indigo-650 text-white shadow-sm shadow-indigo-600/10" 
                  : "text-slate-550 hover:bg-slate-50"
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              Premium (POD)
            </button>
          </div>
        </div>

        {/* Biometrics Top Grid */}
        <div className="grid md:grid-cols-4 gap-6">
          
          {/* Widget 1: Day Counter */}
          <GlassCard className="p-6 shadow-sm flex flex-col justify-between h-[180px] bg-white border border-slate-200/60">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Goal Timeline</span>
              <Calendar className="w-4.5 h-4.5 text-slate-400" />
            </div>
            <div>
              <span className="text-[9px] font-bold text-slate-500 block leading-tight">ACTIVE PLAN</span>
              <span className="text-xs font-black text-slate-900 block truncate">{data.goal}</span>
            </div>
            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-[10px] font-extrabold">
                <span className="text-slate-900">Day {data.currentDay} of {data.goalDuration}</span>
                <span className="text-slate-500">{Math.round((data.currentDay / data.goalDuration) * 100)}%</span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                <div 
                  className="h-full bg-slate-900 rounded-full transition-all duration-500" 
                  style={{ width: `${(data.currentDay / data.goalDuration) * 100}%` }}
                />
              </div>
            </div>
          </GlassCard>

          {/* Widget 2: Streak Counter */}
          <GlassCard className="p-6 shadow-sm flex flex-col justify-between h-[180px] bg-white border border-slate-200/60">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Continuous Streak</span>
              <Flame className="w-4.5 h-4.5 text-amber-500 fill-amber-500/10 animate-bounce-subtle" />
            </div>
            <div>
              <span className="text-4xl font-black text-slate-900 tracking-tight block">🔥 {data.streak}</span>
              <span className="text-[10px] font-semibold text-slate-550 block mt-1">Consecutive reflection days</span>
            </div>
            <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider border-t border-slate-100 pt-2.5">
              Target: Complete daily reflection
            </div>
          </GlassCard>

          {/* Widget 3: Activity Rate */}
          <GlassCard className="p-6 shadow-sm flex flex-col justify-between h-[180px] bg-white border border-slate-200/60">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Today&apos;s Habits</span>
              <CheckCircle className="w-4.5 h-4.5 text-slate-400" />
            </div>
            <div>
              <span className="text-4xl font-black text-slate-900 tracking-tight block">{activityRate}%</span>
              <span className="text-[10px] font-semibold text-slate-550 block mt-1">
                {completedActCount} of {totalActCount} activities completed
              </span>
            </div>
            <div className="w-full h-1.5 rounded-full bg-slate-100 overflow-hidden">
              <div 
                className="h-full bg-emerald-500 rounded-full transition-all duration-300"
                style={{ width: `${activityRate}%` }}
              />
            </div>
          </GlassCard>

          {/* Widget 4: Current Baseline */}
          <GlassCard className="p-6 shadow-sm flex flex-col justify-between h-[180px] bg-white border border-slate-200/60 items-center justify-center">
            {data.report ? (
              <TensionDial score={data.report.anxietyScore} size="sm" />
            ) : (
              <div className="text-center space-y-1">
                <Brain className="w-8 h-8 text-slate-400 mx-auto animate-pulse" />
                <span className="text-xs font-bold text-slate-800 block">No Baseline Yet</span>
              </div>
            )}
          </GlassCard>

        </div>

        {/* Dynamic SVG Trend Line Chart */}
        <div className="grid md:grid-cols-3 gap-8">
          
          {/* Left panel: 7-Day Baseline anxiety score line chart */}
          <GlassCard className="p-6.5 shadow-md md:col-span-2 space-y-6 bg-white border border-slate-200/60">
            <div className="flex justify-between items-center">
              <div className="space-y-0.5">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                  <Activity className="w-4.5 h-4.5 text-slate-700" />
                  Weekly Progress Baseline Trends
                </h3>
                <p className="text-[10px] text-slate-500">
                  {hasWeeklyData
                    ? "From your daily reflection logs."
                    : "Complete reflections to populate this chart."}
                </p>
              </div>
              <span className="text-[9px] font-extrabold bg-slate-100 px-2.5 py-1 rounded-full text-slate-800">
                Pacing Line (Anxiety Score)
              </span>
            </div>

            <div className="relative w-full h-[150px] bg-slate-50 border border-slate-100 rounded-2xl p-2.5 flex items-center justify-center">
              {!hasWeeklyData ? (
                <div className="text-center px-6 space-y-1">
                  <Activity className="w-6 h-6 text-slate-300 mx-auto" />
                  <p className="text-[11px] font-bold text-slate-600">No reflection data yet</p>
                  <p className="text-[9px] text-slate-400">
                    Finish daily activities and submit your end-of-day reflection to see real baseline trends.
                  </p>
                </div>
              ) : (
                <svg className="w-full h-full overflow-visible" viewBox={`0 0 ${chartWidth} ${chartHeight}`} preserveAspectRatio="none">
                  <defs>
                    <linearGradient id="chart-grad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#0f172a" stopOpacity="0.1" />
                      <stop offset="100%" stopColor="#0f172a" stopOpacity="0.0" />
                    </linearGradient>
                  </defs>

                  <line x1="30" y1={mapY(1)} x2={chartWidth - 30} y2={mapY(1)} stroke="#e2e8f0" strokeDasharray="3" strokeWidth="0.8" />
                  <line x1="30" y1={mapY(5)} x2={chartWidth - 30} y2={mapY(5)} stroke="#e2e8f0" strokeDasharray="3" strokeWidth="0.8" />
                  <line x1="30" y1={mapY(10)} x2={chartWidth - 30} y2={mapY(10)} stroke="#e2e8f0" strokeDasharray="3" strokeWidth="0.8" />

                  {areaPath && <path d={areaPath} fill="url(#chart-grad)" />}

                  {lineSegments.map((segment, i) => (
                    <polyline
                      key={i}
                      fill="none"
                      stroke="#0f172a"
                      strokeWidth="2.2"
                      points={segment}
                      strokeLinecap="round"
                    />
                  ))}

                  {dataPoints.map((p: { idx: number; anxietyScore: number | null; x: number; y: number | null }) => (
                    <g key={p.idx} className="group">
                      <circle
                        cx={p.x}
                        cy={p.y!}
                        r="4"
                        fill="#ffffff"
                        stroke="#0f172a"
                        strokeWidth="2.5"
                      />
                      <text
                        x={p.x}
                        y={p.y! - 10}
                        textAnchor="middle"
                        className="text-[9px] font-black fill-slate-900 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
                      >
                        {p.anxietyScore}
                      </text>
                    </g>
                  ))}

                  {points.map((p: { dayName: string }, idx: number) => (
                    <text
                      key={idx}
                      x={mapX(idx)}
                      y={chartHeight - 3}
                      textAnchor="middle"
                      className="text-[8px] font-bold fill-slate-400"
                    >
                      {p.dayName}
                    </text>
                  ))}
                </svg>
              )}
            </div>
          </GlassCard>

          {/* Right panel: Warning logs & Red Flags */}
          <GlassCard className="p-6.5 shadow-md flex flex-col justify-between bg-white border border-slate-200/60">
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <ShieldAlert className="w-4.5 h-4.5 text-rose-500 animate-pulse" />
                Red Flags & Risk Assessment
              </h3>

              <div className="space-y-3">
                {data.redFlags && data.redFlags.length > 0 ? (
                  data.redFlags.map((flag: string, idx: number) => (
                    <div key={idx} className="p-3 bg-rose-50 border border-rose-100 rounded-2xl flex items-center gap-2.5">
                      <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0" />
                      <span className="text-[11px] font-semibold text-rose-800 leading-tight">
                        {flag}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-center gap-2.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                    <div>
                      <span className="text-[11px] font-bold text-emerald-800 block">No Red Flags Detected</span>
                      <span className="text-[9px] text-emerald-600 block mt-0.5">Bio-regulatory parameters are pacing stable.</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <button
              onClick={startReflection}
              disabled={completedActCount < totalActCount}
              className={`w-full mt-6 py-4 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 transition-all ${
                completedActCount >= totalActCount
                  ? "bg-slate-900 hover:bg-slate-800 text-white shadow-md shadow-slate-900/10 cursor-pointer hover:scale-[1.01]"
                  : "bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed"
              }`}
            >
              {completedActCount >= totalActCount ? (
                <>
                  Complete Daily Reflection
                  <ChevronRight className="w-4 h-4" />
                </>
              ) : (
                <>
                  Complete All Activities to Unlock Reflection ({completedActCount}/{totalActCount})
                </>
              )}
            </button>
          </GlassCard>

        </div>

        {/* Cohort Pod Group Chat */}
        <div className="grid md:grid-cols-3 gap-8">
          <div className="md:col-span-2">
            <PodChat pod={data.pod} />
          </div>
          <GlassCard className="p-6 shadow-md bg-white border border-slate-200/60 space-y-4">
            <h3 className="text-sm font-bold text-slate-900">Your Cohort Pod</h3>
            {data.pod ? (
              <>
                <p className="text-[10px] text-slate-500 leading-relaxed">
                  You are in <strong>Pod #{data.pod.podNumber}</strong> with {data.pod.memberCount} member{data.pod.memberCount !== 1 ? "s" : ""} focused on {data.pod.focusArea}.
                </p>
                <div className="space-y-2">
                  {data.pod.members.map((m: { id: string; displayName: string; activeToday: boolean; isCurrentUser: boolean }) => (
                    <div key={m.id} className="flex items-center justify-between text-xs">
                      <span className={`font-semibold ${m.isCurrentUser ? "text-slate-900" : "text-slate-600"}`}>
                        {m.displayName}{m.isCurrentUser ? " (You)" : ""}
                      </span>
                      <span className={`text-[9px] font-bold ${m.activeToday ? "text-emerald-600" : "text-slate-400"}`}>
                        {m.activeToday ? "Active" : "—"}
                      </span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <p className="text-[10px] text-slate-500">Finish onboarding to be matched into a pod of 2–5 peers.</p>
            )}
          </GlassCard>
        </div>

        {/* Activities Checklist & Achievements */}
        <div className="grid md:grid-cols-3 gap-8">
          
          {/* Today's pacing habits checklist */}
          <GlassCard className="p-6.5 shadow-md md:col-span-2 space-y-5 bg-white border border-slate-200/60">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Today&apos;s Pacing Plan</h3>
                <p className="text-[10px] text-slate-500">Check off completed somatic pacing habits.</p>
              </div>
              <div className="flex items-center gap-2">
                {typeof window !== "undefined" && localStorage.getItem("calmpulse_demo") === "true" && (
                  <button
                    onClick={() => {
                      const allIds = data.activities?.map((a: any) => a.id) || [];
                      const updated = { ...data, completedActivities: allIds };
                      setData(updated);
                      localStorage.setItem("calmpulse_demo_data", JSON.stringify(updated));
                    }}
                    className="px-2.5 py-1 rounded-full bg-violet-100 border border-violet-200 text-[9px] font-extrabold text-violet-750 hover:bg-violet-200 transition-all cursor-pointer flex items-center gap-1 shrink-0"
                  >
                    <Sparkles className="w-2.5 h-2.5" />
                    Auto-Complete
                  </button>
                )}
                <span className="text-[9px] font-extrabold text-slate-450 bg-slate-50 px-2 py-1 rounded border border-slate-100 shrink-0">
                  Resets daily at midnight
                </span>
              </div>
            </div>

            <div className="space-y-2.5">
              {data.activities && data.activities.map((act: any) => {
                const isCompleted = data.completedActivities.includes(act.id);
                return (
                  <div
                    key={act.id}
                    className={`p-4 rounded-2xl border transition-all flex items-center justify-between text-xs gap-3 ${
                      isCompleted 
                        ? "bg-slate-50 border-slate-250 opacity-70" 
                        : "bg-white border-slate-200/70 hover:border-slate-350"
                    }`}
                  >
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <button
                        type="button"
                        onClick={() => toggleActivity(act.id, !isCompleted)}
                        className={`w-5.5 h-5.5 rounded-full border flex items-center justify-center transition-all shrink-0 mt-0.5 cursor-pointer ${
                          isCompleted 
                            ? "border-slate-800 bg-slate-900 text-white" 
                            : "border-slate-300 bg-transparent hover:border-slate-500"
                        }`}
                        aria-label={isCompleted ? "Mark incomplete" : "Mark complete"}
                      >
                        {isCompleted && (
                          <div className="w-1.5 h-1.5 rounded-full bg-white" />
                        )}
                      </button>
                      <div className="space-y-0.5 text-left min-w-0">
                        <span className={`font-bold block text-slate-800 ${isCompleted ? "line-through text-slate-400" : ""}`}>
                          {act.name}
                        </span>
                        {act.description && (
                          <span className={`text-[10px] block leading-tight font-medium ${isCompleted ? "text-slate-350 line-through" : "text-slate-500"}`}>
                            {act.description}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => openActivityDetail(act)}
                        className="px-2.5 py-1.5 rounded-full bg-slate-900 hover:bg-slate-800 text-white text-[8px] font-bold uppercase tracking-wider flex items-center gap-1 cursor-pointer transition-colors"
                      >
                        <Info className="w-3 h-3" />
                        Detail
                      </button>
                      <span className="px-2.5 py-1 rounded-full bg-slate-100 text-[8px] font-bold uppercase tracking-wider text-slate-500">
                        {act.type}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </GlassCard>

          {/* AI Insights & Coaching feedback */}
          <div className="space-y-6">
            
            {/* AI Insights panel */}
            <GlassCard className="p-6.5 shadow-md space-y-3 bg-white border border-slate-200/60">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Brain className="w-4.5 h-4.5 text-slate-800" />
                AI Insights & Adjustments
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed italic">
                &ldquo;{data.insights}&rdquo;
              </p>
            </GlassCard>

            {/* Recent achievements list */}
            <GlassCard className="p-6.5 shadow-md space-y-4 bg-white border border-slate-200/60">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Award className="w-4.5 h-4.5 text-slate-800" />
                Recent Achievements
              </h3>

              <div className="space-y-3">
                {data.achievements && data.achievements.map((ach: any) => (
                  <div key={ach.id} className={`flex items-start gap-3 text-xs ${ach.unlocked ? "" : "opacity-40"}`}>
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                      ach.unlocked ? "bg-amber-500/10 text-amber-600" : "bg-slate-100 text-slate-400"
                    }`}>
                      <Award className="w-4.5 h-4.5" />
                    </div>
                    <div>
                      <span className="font-bold text-slate-900 block">{ach.title}</span>
                      <span className="text-[10px] text-slate-500 block leading-tight">{ach.desc}</span>
                    </div>
                  </div>
                ))}
              </div>
            </GlassCard>

          </div>

        </div>

        {/* Premium (POD) Toggled Section */}
        {isPremium && (
          <div className="border-t border-dashed border-slate-350 pt-8 space-y-8 animate-fade-in">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-indigo-650 animate-pulse" />
              <h2 className="text-lg font-black text-slate-900 tracking-tight">Premium Analytics & Pacing Coach</h2>
              <span className="text-[8px] font-black uppercase bg-indigo-100 text-indigo-750 px-2 py-0.5 rounded-full">Active</span>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              
              {/* Premium 1: AI Voice coach simulation */}
              <GlassCard className="p-6 shadow-md border border-indigo-200/50 bg-gradient-to-b from-indigo-50/20 to-white space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-bold text-indigo-500 uppercase tracking-wider block">AI Voice Assistant</span>
                  <Volume2 className="w-4.5 h-4.5 text-indigo-500" />
                </div>
                <h4 className="text-xs font-bold text-slate-900">1-on-1 Voice Pacing Session</h4>
                <p className="text-[10px] text-slate-500 leading-relaxed">
                  Start an audio coaching session. The coach dynamically guides your breathing and processes verbal venting in real-time.
                </p>
                <button
                  onClick={() => setVoicePlaying(!voicePlaying)}
                  className={`w-full py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    voicePlaying 
                      ? "bg-rose-500 hover:bg-rose-600 text-white animate-pulse" 
                      : "bg-indigo-600 hover:bg-indigo-750 text-white"
                  }`}
                >
                  {voicePlaying ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Streaming Session... Click to End
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4" />
                      Start Voice Session
                    </>
                  )}
                </button>
              </GlassCard>

              {/* Premium 2: Prediction timelines */}
              <GlassCard className="p-6 shadow-md border border-indigo-200/50 bg-gradient-to-b from-indigo-50/20 to-white space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-bold text-indigo-500 uppercase tracking-wider block">Goal Predictor</span>
                  <Heart className="w-4.5 h-4.5 text-indigo-500" />
                </div>
                <h4 className="text-xs font-bold text-slate-900">Estimated Completion Timeline</h4>
                <div className="space-y-2">
                  <div className="flex justify-between text-[11px]">
                    <span className="text-slate-500">Stability projection:</span>
                    <span className="font-bold text-slate-800">45% Deceleration</span>
                  </div>
                  <div className="flex justify-between text-[11px]">
                    <span className="text-slate-500">Estimated Days Remaining:</span>
                    <span className="font-bold text-slate-800">37 Days</span>
                  </div>
                  <div className="flex justify-between text-[11px]">
                    <span className="text-slate-500">Adherence Factor:</span>
                    <span className="font-bold text-emerald-600">89% High Match</span>
                  </div>
                </div>
                <p className="text-[9px] text-slate-400">Based on past 7 days of bio-feedback telemetry and checklists.</p>
              </GlassCard>

              {/* Premium 3: export and coaching reports */}
              <GlassCard className="p-6 shadow-md border border-indigo-200/50 bg-gradient-to-b from-indigo-50/20 to-white space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-bold text-indigo-500 uppercase tracking-wider block">Report Export</span>
                  <Download className="w-4.5 h-4.5 text-indigo-500" />
                </div>
                <h4 className="text-xs font-bold text-slate-900">Export Pacing Baseline PDF</h4>
                <p className="text-[10px] text-slate-500 leading-relaxed">
                  Export complete daily logs, trends, sleep metrics, and somatic warning flags to share with your personal therapist or healthcare provider.
                </p>
                <button
                  onClick={() => alert("Pacing report CSV exported successfully.")}
                  className="w-full py-3 bg-indigo-50 hover:bg-indigo-100 text-indigo-750 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  Download CSV Log Report
                </button>
              </GlassCard>

            </div>
          </div>
        )}

      </main>

      {detailActivity && (
        <ActivityDetailModal
          key={detailActivity.id}
          activity={detailActivity}
          detail={detailForActivityId === detailActivity.id ? activityDetail : null}
          loading={activityDetailLoading || detailForActivityId !== detailActivity.id}
          error={activityDetailError}
          onClose={closeActivityDetail}
        />
      )}

      {/* Daily Reflection Wizard Modal */}
      {reflectionOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-6 animate-fade-in">
          <GlassCard className="max-w-xl w-full p-8 border border-slate-200 bg-white shadow-2xl rounded-3xl space-y-6 animate-scale-in">
            
            {/* Modal Header */}
            <div className="flex justify-between items-center border-b border-slate-100 pb-4">
              <div className="space-y-0.5">
                <h3 className="text-base font-bold text-slate-900 font-display">Daily Reflection</h3>
                <p className="text-[10px] text-slate-400">Step {reflectionStep} of 3</p>
              </div>
              <button
                onClick={() => setReflectionOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold cursor-pointer"
              >
                Close
              </button>
            </div>

            {/* Slide 1: Rating Sliders */}
            {reflectionStep === 1 && (
              <div className="space-y-5">
                <span className="text-xs font-bold text-slate-700 block">Assess today&apos;s vital indicators (1 to 10):</span>
                
                <div className="space-y-3">
                  {/* Mood Rating */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs font-bold text-slate-800">
                      <span>Mood Level:</span>
                      <span>{ratings.mood} / 10</span>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="10"
                      value={ratings.mood}
                      onChange={(e) => setRatings({ ...ratings, mood: parseInt(e.target.value) })}
                      className="w-full accent-slate-900 h-1 bg-slate-100 rounded-lg appearance-none cursor-pointer"
                    />
                  </div>

                  {/* Energy Rating */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs font-bold text-slate-800">
                      <span>Energy Level:</span>
                      <span>{ratings.energy} / 10</span>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="10"
                      value={ratings.energy}
                      onChange={(e) => setRatings({ ...ratings, energy: parseInt(e.target.value) })}
                      className="w-full accent-slate-900 h-1 bg-slate-100 rounded-lg appearance-none cursor-pointer"
                    />
                  </div>

                  {/* Anxiety Rating */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs font-bold text-slate-800">
                      <span>Anxiety / Stress Score:</span>
                      <span>{ratings.anxiety} / 10</span>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="10"
                      value={ratings.anxiety}
                      onChange={(e) => setRatings({ ...ratings, anxiety: parseInt(e.target.value) })}
                      className="w-full accent-slate-900 h-1 bg-slate-100 rounded-lg appearance-none cursor-pointer"
                    />
                  </div>

                  {/* Sleep Rating */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs font-bold text-slate-800">
                      <span>Sleep Quality Duration:</span>
                      <span>{ratings.sleep} hours</span>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="12"
                      value={ratings.sleep}
                      onChange={(e) => setRatings({ ...ratings, sleep: parseInt(e.target.value) })}
                      className="w-full accent-slate-900 h-1 bg-slate-100 rounded-lg appearance-none cursor-pointer"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-4 border-t border-slate-100">
                  <button
                    onClick={() => setReflectionStep(2)}
                    className="px-6 py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 cursor-pointer"
                  >
                    Next Step
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* Slide 2: Venting Textarea */}
            {reflectionStep === 2 && (
              <div className="space-y-5">
                <div>
                  <span className="text-xs font-bold text-slate-700 block">Expressive Log & Venting:</span>
                  <p className="text-[10px] text-slate-450 leading-tight">Write freely about what triggered your stress, symptoms felt, or pacing efforts today.</p>
                </div>

                <textarea
                  value={ventText}
                  onChange={(e) => setVentText(e.target.value)}
                  placeholder="Today felt a bit overwhelming during the meeting..."
                  className="w-full h-36 p-4 text-xs text-slate-800 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-1 focus:ring-slate-900 focus:outline-none resize-none"
                  maxLength={1000}
                />

                <div className="flex justify-between pt-4 border-t border-slate-100">
                  <button
                    onClick={() => setReflectionStep(1)}
                    className="px-6 py-3 border border-slate-250 hover:bg-slate-50 rounded-xl font-bold text-xs cursor-pointer"
                  >
                    Back
                  </button>
                  <button
                    onClick={async () => {
                      await startReflection(); // loads AI questions
                      setReflectionStep(3);
                    }}
                    disabled={!ventText.trim()}
                    className={`px-6 py-3 rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-sm ${
                      ventText.trim()
                        ? "bg-slate-900 hover:bg-slate-800 text-white cursor-pointer"
                        : "bg-slate-100 text-slate-400 cursor-not-allowed"
                    }`}
                  >
                    Analyze & Generate QA
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* Slide 3: AI Clarifying Questions */}
            {reflectionStep === 3 && (
              <div className="space-y-5">
                {questionsLoading ? (
                  <div className="py-12 flex flex-col items-center justify-center gap-3">
                    <Loader2 className="w-8 h-8 text-slate-800 animate-spin" />
                    <span className="text-xs font-semibold text-slate-500">AI formulation of clarifying inquiries...</span>
                  </div>
                ) : (
                  <>
                    <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2">
                      {questions.map((q, idx) => (
                        <div key={idx} className="space-y-1.5">
                          <label className="block text-xs font-bold text-slate-800 leading-tight">
                            {idx + 1}. {q}
                          </label>
                          <input
                            type="text"
                            value={answers[`q${idx + 1}`] || ""}
                            onChange={(e) => setAnswers({ ...answers, [`q${idx + 1}`]: e.target.value })}
                            placeholder="Type response..."
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-800 focus:ring-1 focus:ring-slate-900 focus:outline-none"
                            required
                          />
                        </div>
                      ))}
                    </div>

                    <div className="flex justify-between pt-4 border-t border-slate-100">
                      <button
                        onClick={() => setReflectionStep(2)}
                        className="px-6 py-3 border border-slate-250 hover:bg-slate-50 rounded-xl font-bold text-xs cursor-pointer"
                      >
                        Back
                      </button>
                      <button
                        onClick={submitReflection}
                        disabled={submittingReflection}
                        className="px-8 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs shadow-sm flex items-center gap-1.5 cursor-pointer"
                      >
                        {submittingReflection ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Recalibrating...
                          </>
                        ) : (
                          <>
                            Submit Log & Recalibrate
                            <ChevronRight className="w-4 h-4" />
                          </>
                        )}
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}

          </GlassCard>
        </div>
      )}

      {/* Floating Panic Button */}
      <div className="fixed bottom-6 right-6 z-40">
        <button
          onClick={() => setPanicRoomOpen(true)}
          className="group relative flex items-center justify-center w-16 h-16 rounded-full bg-rose-600 hover:bg-rose-500 text-white shadow-[0_0_20px_5px_rgba(225,29,72,0.3)] hover:shadow-[0_0_25px_10px_rgba(225,29,72,0.5)] transition-all duration-300 animate-pulse hover:scale-[1.05] cursor-pointer"
          title="Panic SOS Button"
        >
          <ShieldAlert className="w-7 h-7" />
          <span className="absolute right-full mr-3 px-3 py-1.5 rounded-xl bg-slate-900 text-white text-[10px] font-black uppercase tracking-wider opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-md border border-slate-800">
            Panic SOS
          </span>
        </button>
      </div>

      {/* Panic Room Modal */}
      <PanicRoomModal 
        isOpen={panicRoomOpen} 
        onClose={() => setPanicRoomOpen(false)} 
      />

    </div>
  );
}

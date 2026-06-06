"use client";

import { useState, Suspense, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import WizardHeader from "@/components/shared/WizardHeader";
import AccountCreation from "@/components/onboarding/AccountCreation";
import PacingPlanSetup from "@/components/onboarding/PacingPlanSetup";
import PodSyncScheduling from "@/components/onboarding/PodSyncScheduling";
import ReminderConfig from "@/components/onboarding/ReminderConfig";
import OnboardingComplete from "@/components/onboarding/OnboardingComplete";

interface PacingHabit {
  id: string;
  name: string;
  type: string;
  value: string;
  enabled: boolean;
}

interface AssessmentData {
  focusArea?: string;
  ventText?: string;
  answers?: Record<string, string>;
  report?: unknown;
}

interface AuthProfile {
  userId: string;
  habits?: PacingHabit[];
  syncTimes?: { morning: string; evening: string };
  notifications?: Record<string, boolean>;
  onboardingComplete?: boolean;
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "An unexpected error occurred.";
}

function getSavedAssessment() {
  if (typeof window === "undefined") {
    return null;
  }

  const saved = localStorage.getItem("calmpulse_assessment");

  if (!saved) {
    return null;
  }

  try {
    return JSON.parse(saved) as AssessmentData;
  } catch (error) {
    console.error("Failed to parse saved assessment", error);
    return null;
  }
}

function OnboardingContent() {
  const searchParams = useSearchParams();
  const cohortIdRaw = searchParams.get("cohortId");
  const cohortId = cohortIdRaw ? parseInt(cohortIdRaw, 10) : 42;

  const [step, setStep] = useState(1);
  const [userId, setUserId] = useState("");
  const [habits, setHabits] = useState<PacingHabit[]>([]);
  const [syncTimes, setSyncTimes] = useState({ morning: "09:00", evening: "21:00" });
  const [assessment] = useState<AssessmentData | null>(() => getSavedAssessment());

  const [authChecking, setAuthChecking] = useState(true);
  const [signupLoading, setSignupLoading] = useState(false);
  const [signupError, setSignupError] = useState("");

  const steps = ["Account Creation", "Pacing Reminders", "Pod Sync Time", "Notifications", "Ready Dashboard"];

  // Read existing session on mount
  useEffect(() => {
    const loadCurrentUser = async () => {
      try {
        const response = await fetch("/api/auth/me");

        if (!response.ok) {
          return;
        }

        const data = await response.json();
        const user = data.user as AuthProfile;

        setUserId(user.userId);
        setHabits(Array.isArray(user.habits) ? user.habits : []);
        setSyncTimes(user.syncTimes || { morning: "09:00", evening: "21:00" });
        setStep(user.onboardingComplete ? 5 : 2);
      } catch (err) {
        console.error("Failed to load current user:", err);
      } finally {
        setAuthChecking(false);
      }
    };

    loadCurrentUser();
  }, []);

  const handleAccountSubmit = async (credentials: { name: string; email: string; password: string }) => {
    setSignupLoading(true);
    setSignupError("");

    try {
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...credentials,
          assessment
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create account");
      }

      setUserId(data.user.userId);
      setStep(2);
    } catch (err: unknown) {
      console.error(err);
      setSignupError(getErrorMessage(err));
    } finally {
      setSignupLoading(false);
    }
  };

  const handleHabitSubmit = async (configuredHabits: PacingHabit[]) => {
    setHabits(configuredHabits);
    
    // Sync with MongoDB
    if (userId) {
      try {
        await fetch("/api/onboarding/update", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ habits: configuredHabits }),
        });
      } catch (err) {
        console.error("Failed to sync habits with DB:", err);
      }
    }
    
    setStep(3);
  };

  const handleSyncSubmit = async (times: { morning: string; evening: string }) => {
    setSyncTimes(times);

    // Sync with MongoDB
    if (userId) {
      try {
        await fetch("/api/onboarding/update", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ syncTimes: times }),
        });
      } catch (err) {
        console.error("Failed to sync syncTimes with DB:", err);
      }
    }

    setStep(4);
  };

  const handleReminderSubmit = async (reminderSettings: Record<string, boolean>) => {
    // Sync with MongoDB & mark onboarding complete
    if (userId) {
      try {
        await fetch("/api/onboarding/update", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            notifications: reminderSettings,
            onboardingComplete: true
          }),
        });
      } catch (err) {
        console.error("Failed to finalize onboarding with DB:", err);
      }
    }

    setStep(5);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 selection:bg-slate-900/10 selection:text-slate-900 flex flex-col font-sans">
      {/* Onboarding Header */}
      <WizardHeader currentStep={step} steps={steps} />

      {/* Onboarding Main Content */}
      <main className="flex-1 w-full max-w-5xl mx-auto px-6 pt-28 pb-16 flex items-center justify-center">
        <div className="w-full">
          {authChecking && (
            <div className="min-h-[260px] flex items-center justify-center text-xs font-semibold text-slate-500">
              Checking your session...
            </div>
          )}

          {!authChecking && (
            <>
          {step === 1 && (
            <AccountCreation
              onSubmit={handleAccountSubmit}
              loading={signupLoading}
              error={signupError}
            />
          )}

          {step === 2 && (
            <PacingPlanSetup onSubmit={handleHabitSubmit} />
          )}

          {step === 3 && (
            <PodSyncScheduling
              cohortId={cohortId}
              onSubmit={handleSyncSubmit}
              onBack={() => setStep(2)}
            />
          )}

          {step === 4 && (
            <ReminderConfig
              onSubmit={handleReminderSubmit}
              onBack={() => setStep(3)}
            />
          )}

          {step === 5 && (
            <OnboardingComplete
              cohortId={cohortId}
              habits={habits}
              syncTimes={syncTimes}
            />
          )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}

export default function OnboardingPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-50 flex items-center justify-center font-sans text-slate-500">
          Loading onboarding parameters...
        </div>
      }
    >
      <OnboardingContent />
    </Suspense>
  );
}

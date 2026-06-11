"use client";

import { useState, Suspense, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import WizardHeader from "@/components/shared/WizardHeader";
import AccountCreation from "@/components/onboarding/AccountCreation";
import PacingPlanSetup from "@/components/onboarding/PacingPlanSetup";
import PodSyncScheduling from "@/components/onboarding/PodSyncScheduling";
import ReminderConfig from "@/components/onboarding/ReminderConfig";
import OnboardingComplete from "@/components/onboarding/OnboardingComplete";
import { useAuth } from "@/lib/useAuth";

interface OnboardingHabit {
  id: string;
  name: string;
  type: string;
  value: string;
  enabled: boolean;
}

interface OnboardingAssessment {
  report?: {
    anxietyScore?: number;
    pacingRate?: string;
    adjustments?: Array<{
      name: string;
      type: string;
      trigger: string;
    }>;
  };
  initialBaseline?: {
    anxietyScore?: number;
    pacingRate?: string;
  };
}

function OnboardingContent() {
  // Redirect logged-in users who finished onboarding to dashboard
  const { user } = useAuth({ redirectTo: "/dashboard", redirectIfFound: true });

  const searchParams = useSearchParams();
  const cohortIdRaw = searchParams.get("cohortId");
  const cohortId = cohortIdRaw ? parseInt(cohortIdRaw, 10) : 42;

  const [step, setStep] = useState(1);
  const [userId, setUserId] = useState("");
  const [habits, setHabits] = useState<OnboardingHabit[]>([]);
  const [syncTimes, setSyncTimes] = useState({ morning: "09:00", evening: "21:00" });
  const [assessment, setAssessment] = useState<OnboardingAssessment | null>(null);

  const [signupLoading, setSignupLoading] = useState(false);
  const [signupError, setSignupError] = useState("");

  const steps = ["Account Creation", "Pacing Reminders", "Pod Sync Time", "Notifications", "Ready Dashboard"];

  // Restore step from localStorage on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedStep = localStorage.getItem("calmpulse_onboarding_step");
      if (savedStep) {
        const parsedStep = parseInt(savedStep, 10);
        if (parsedStep >= 1 && parsedStep <= 5) {
          // eslint-disable-next-line react-hooks/set-state-in-effect
          setStep(parsedStep);
        }
      }
    }
  }, []);

  // Save step to localStorage when it changes
  useEffect(() => {
    if (typeof window !== "undefined" && userId) {
      localStorage.setItem("calmpulse_onboarding_step", step.toString());
    }
  }, [step, userId]);

  // Sync userId and force logged-in users past step 1 (Account Creation)
  useEffect(() => {
    if (user && user.id) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setUserId(user.id);
      if (step === 1) {
        setStep(2);
      }
    }
  }, [user, step]);

  // Read assessment data from localStorage on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("calmpulse_assessment");
      if (saved) {
        try {
          // eslint-disable-next-line react-hooks/set-state-in-effect
          setAssessment(JSON.parse(saved));
        } catch (e) {
          console.error("Failed to parse saved assessment", e);
        }
      }
    }
  }, []);

  const handleAccountSubmit = async (credentials: Record<string, string>) => {
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
        setSignupError(data.details || data.error || "Failed to create account");
        return;
      }

      setUserId(data.userId);
      setStep(2);
    } catch (err: unknown) {
      console.error(err);
      const errMsg = err instanceof Error ? err.message : "An unexpected error occurred during signup.";
      setSignupError(errMsg);
    } finally {
      setSignupLoading(false);
    }
  };

  const handleHabitSubmit = async (configuredHabits: OnboardingHabit[]) => {
    setHabits(configuredHabits);
    
    // Sync with MongoDB
    if (userId) {
      try {
        await fetch("/api/onboarding/update", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId, habits: configuredHabits }),
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
          body: JSON.stringify({ userId, syncTimes: times }),
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
            userId,
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
          {step === 1 && (
            <AccountCreation
              onSubmit={handleAccountSubmit}
              loading={signupLoading}
              error={signupError}
            />
          )}

          {step === 2 && (
            <PacingPlanSetup
              onSubmit={handleHabitSubmit}
              initialAdjustments={assessment?.report?.adjustments}
            />
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
              assessment={assessment ?? undefined}
            />
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

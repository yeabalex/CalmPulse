"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ShieldCheck, Loader2, AlertCircle } from "lucide-react";
import GlassCard from "@/components/shared/GlassCard";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [pageChecking, setPageChecking] = useState(true);
  const [error, setError] = useState("");

  // Redirect if already logged in
  useEffect(() => {
    async function checkSession() {
      try {
        const res = await fetch("/api/auth/session");
        if (res.ok) {
          const data = await res.json();
          if (data.authenticated) {
            if (data.user.onboardingComplete) {
              router.push("/dashboard");
            } else {
              router.push(`/onboarding?cohortId=${data.user.cohortId || 42}`);
            }
            return;
          }
        }
      } catch (e) {
        console.error("Session check failed", e);
      } finally {
        setPageChecking(false);
      }
    }
    checkSession();
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email.trim() || !password.trim()) {
      setError("Please fill in all fields.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Login failed");
      }

      if (data.onboardingComplete) {
        router.push("/dashboard");
      } else {
        router.push("/onboarding");
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  if (pageChecking) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center font-sans text-slate-500">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="w-8 h-8 text-slate-900 animate-spin" />
          <span className="text-xs font-semibold">Checking session status...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 selection:bg-slate-900/10 selection:text-slate-900 flex flex-col font-sans justify-center items-center px-6 py-12">
      <div className="w-full max-w-md space-y-8">
        
        {/* Logo Banner */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2.5 mx-auto">
            <div className="w-9 h-9 rounded-xl bg-slate-900 flex items-center justify-center text-white font-bold shadow-md shadow-slate-900/10">
              C
            </div>
            <span className="text-2xl font-bold tracking-tight text-slate-900">
              Calm<span className="font-display italic text-slate-600 font-semibold">Pulse</span>
            </span>
          </div>
          <h2 className="text-xl font-bold text-slate-905 tracking-tight pt-2">
            Welcome back to CalmPulse
          </h2>
          <p className="text-xs text-slate-500">
            Sign in to access your dashboard, peer pod syncs, and AI insights.
          </p>
        </div>

        {/* Login Form Container */}
        <GlassCard className="p-8 border border-slate-200/60 bg-white/80 shadow-xl rounded-3xl">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-4">
              
              {/* Email */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700">
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-xs text-slate-800 focus:ring-1 focus:ring-slate-900 focus:outline-none"
                  required
                />
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700">
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-xs text-slate-800 focus:ring-1 focus:ring-slate-900 focus:outline-none"
                  required
                />
              </div>

            </div>

            {/* Display Error Message */}
            {error && (
              <div className="flex items-start gap-2 text-xs text-rose-600 bg-rose-50 border border-rose-100 p-3.5 rounded-xl">
                <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                <span className="font-semibold">{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-xs shadow-md shadow-slate-900/10 flex items-center justify-center gap-2 cursor-pointer transition-all duration-300"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Logging in...
                </>
              ) : (
                "Log In"
              )}
            </button>
          </form>

          {/* Prompt to register */}
          <div className="text-center pt-6 border-t border-slate-100 mt-6 text-xs text-slate-500">
            Don't have an account?{" "}
            <Link href="/intake" className="font-bold text-slate-900 hover:underline">
              Take Assessment & Register
            </Link>
          </div>
        </GlassCard>

        <div className="text-center">
          <Link href="/" className="text-xs font-semibold text-slate-500 hover:text-slate-800 hover:underline">
            ← Back to home page
          </Link>
        </div>

      </div>
    </div>
  );
}

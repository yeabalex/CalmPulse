"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { AlertCircle, ArrowRight, Loader2, LockKeyhole } from "lucide-react";

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Unable to log in";
}

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Unable to log in");
      }

      router.push("/onboarding");
      router.refresh();
    } catch (err: unknown) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900 flex items-center justify-center px-6 py-12 font-sans">
      <div className="w-full max-w-md space-y-8">
        <div className="space-y-3 text-center">
          <Link href="/" className="inline-flex items-center justify-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center text-white font-bold shadow-md shadow-slate-900/10">
              C
            </div>
            <span className="text-xl font-bold tracking-tight text-slate-900">
              Calm<span className="font-display italic text-slate-600 font-semibold">Pulse</span>
            </span>
          </Link>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 font-display">
            Log in
          </h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com"
                className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-xs text-slate-900 focus:ring-1 focus:ring-slate-900 focus:outline-none"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Password"
                className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-xs text-slate-900 focus:ring-1 focus:ring-slate-900 focus:outline-none"
                required
              />
            </div>
          </div>

          {error && (
            <div className="flex items-start gap-2 text-xs text-rose-600 bg-rose-50 border border-rose-100 p-3.5 rounded-xl">
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
              <span className="font-semibold">{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-xs shadow-md shadow-slate-900/10 flex items-center justify-center gap-2 cursor-pointer transition-all duration-300 disabled:opacity-70"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Logging in...
              </>
            ) : (
              <>
                <LockKeyhole className="w-4 h-4" />
                Continue
              </>
            )}
          </button>
        </form>

        <div className="flex items-center justify-center gap-2 text-xs text-slate-500">
          <span>New to CalmPulse?</span>
          <Link href="/intake" className="font-bold text-slate-900 hover:text-slate-700 flex items-center gap-1">
            Start assessment
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </main>
  );
}

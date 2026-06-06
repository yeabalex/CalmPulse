"use client";

import { useState } from "react";
import { Shield, Loader2, AlertCircle } from "lucide-react";

interface AccountCreationProps {
  onSubmit: (credentials: { name: string; email: string; password: string }) => Promise<void>;
  loading: boolean;
  error: string;
}

export default function AccountCreation({ onSubmit, loading, error }: AccountCreationProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [formError, setFormError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    if (!name.trim() || !email.trim() || !password.trim()) {
      setFormError("All fields are required.");
      return;
    }

    if (password.length < 8) {
      setFormError("Password must be at least 8 characters.");
      return;
    }

    onSubmit({ name: name.trim(), email: email.trim(), password });
  };

  return (
    <div className="space-y-8 animate-fade-in max-w-md mx-auto w-full">
      <div className="space-y-3 text-center">
        <h2 className="text-2xl md:text-3xl font-bold text-slate-900 font-display">
          Create Your Profile
        </h2>
        <p className="text-xs text-slate-500 max-w-sm mx-auto">
          Set up your credentials to sync your pacing baseline and securely access your anonymous peer pod.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-4">
          
          {/* Nickname */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700">
              Pod Nickname (Visible to Cohort)
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. CalmPacer42"
              className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-xs text-slate-805 focus:ring-1 focus:ring-slate-900 focus:outline-none"
              required
            />
          </div>

          {/* Email */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700">
              Email Address (Private)
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-xs text-slate-850 focus:ring-1 focus:ring-slate-900 focus:outline-none"
              required
            />
          </div>

          {/* Password */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700">
              Security Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-xs text-slate-805 focus:ring-1 focus:ring-slate-900 focus:outline-none"
              required
            />
          </div>

        </div>

        {/* Display Error Message */}
        {(error || formError) && (
          <div className="flex items-start gap-2 text-xs text-rose-600 bg-rose-50 border border-rose-100 p-3.5 rounded-xl">
            <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
            <span className="font-semibold">{formError || error}</span>
          </div>
        )}

        <div className="flex items-start gap-2.5 text-[10px] text-slate-500 bg-slate-50 border border-slate-200 p-3.5 rounded-xl">
          <Shield className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
          <span className="leading-relaxed">
            Your password is stored as a salted hash. To protect your identity, only your nickname is visible to other members of your peer pod.
          </span>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-4 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-xs shadow-md shadow-slate-900/10 flex items-center justify-center gap-2 cursor-pointer transition-all duration-300"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Creating Account...
            </>
          ) : (
            "Create Account & Continue"
          )}
        </button>
      </form>
    </div>
  );
}

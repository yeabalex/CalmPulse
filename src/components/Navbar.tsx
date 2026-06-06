"use client";

import Link from "next/link";
import { ArrowRight, Sparkles, LogOut, LayoutDashboard } from "lucide-react";
import { useEffect, useState } from "react";

export default function Navbar() {
  const [authenticated, setAuthenticated] = useState(false);

  useEffect(() => {
    async function checkSession() {
      try {
        const res = await fetch("/api/auth/session");
        if (res.ok) {
          const data = await res.json();
          if (data.authenticated) {
            setAuthenticated(true);
          }
        }
      } catch (e) {
        console.error(e);
      }
    }
    checkSession();
  }, []);

  const handleLogout = async () => {
    try {
      const res = await fetch("/api/auth/logout", { method: "POST" });
      if (res.ok) {
        window.location.href = "/login";
      }
    } catch (e) {
      console.error("Logout error:", e);
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 glass-panel border-b border-slate-200/40 py-4 px-6 md:px-12 flex justify-between items-center transition-all duration-300">
      <div className="flex items-center gap-2.5">
        <Link href="/" className="flex items-center gap-2.5 hover:opacity-90">
          <div className="w-9 h-9 rounded-xl bg-slate-900 flex items-center justify-center text-white font-bold shadow-md shadow-slate-900/10">
            C
          </div>
          <span className="text-xl font-bold tracking-tight text-slate-900">
            Calm<span className="font-display italic text-slate-600 font-semibold">Pulse</span>
          </span>
        </Link>
      </div>
      
      <nav className="hidden md:flex items-center gap-8 text-sm font-semibold text-slate-650">
        <Link href="#how-it-works" className="hover:text-slate-950 transition-colors">
          Methodology
        </Link>
        <Link href="#services" className="hover:text-slate-950 transition-colors">
          Anxiety Subtypes
        </Link>
        <Link href="#companion" className="hover:text-slate-950 transition-colors">
          AI Engine
        </Link>
        {authenticated ? (
          <Link href="/dashboard" className="hover:text-slate-950 transition-colors flex items-center gap-1.5 text-slate-900 font-bold">
            <LayoutDashboard className="w-4 h-4 text-slate-800" />
            My Dashboard
          </Link>
        ) : (
          <Link href="/intake" className="hover:text-slate-950 transition-colors flex items-center gap-1">
            <Sparkles className="w-4 h-4 text-amber-500 animate-pulse" />
            Adaptive Intake
          </Link>
        )}
      </nav>

      <div className="flex items-center gap-4">
        {authenticated ? (
          <>
            <Link
              href="/dashboard"
              className="group relative inline-flex items-center justify-center p-0.5 overflow-hidden text-xs md:text-sm font-semibold text-slate-900 rounded-full bg-slate-200 hover:bg-slate-300 transition-all duration-300"
            >
              <span className="relative px-5 py-2 transition-all ease-in duration-75 bg-white rounded-full group-hover:bg-slate-50 flex items-center gap-2">
                My Dashboard
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </span>
            </Link>
            <button
              onClick={handleLogout}
              className="p-2.5 text-slate-400 hover:text-slate-900 rounded-full hover:bg-slate-100 transition-all cursor-pointer"
              title="Log Out"
            >
              <LogOut className="w-4.5 h-4.5" />
            </button>
          </>
        ) : (
          <>
            <Link
              href="/login"
              className="text-xs md:text-sm font-bold text-slate-700 hover:text-slate-950 transition-colors px-3 py-2"
            >
              Sign In
            </Link>
            <Link
              href="/intake"
              className="group relative inline-flex items-center justify-center p-0.5 overflow-hidden text-xs md:text-sm font-semibold text-slate-900 rounded-full bg-slate-200 hover:bg-slate-300 transition-all duration-300"
            >
              <span className="relative px-5 py-2 transition-all ease-in duration-75 bg-white rounded-full group-hover:bg-slate-50 flex items-center gap-2">
                Start Assessment
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </span>
            </Link>
          </>
        )}
      </div>
    </header>
  );
}

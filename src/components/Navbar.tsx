"use client";

import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";

export default function Navbar() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 glass-panel border-b border-slate-200/40 py-4 px-6 md:px-12 flex justify-between items-center transition-all duration-300">
      <div className="flex items-center gap-2.5">
        <div className="w-9 h-9 rounded-xl bg-slate-900 flex items-center justify-center text-white font-bold shadow-md shadow-slate-900/10">
          C
        </div>
        <span className="text-xl font-bold tracking-tight text-slate-900">
          Calm<span className="font-display italic text-slate-600 font-semibold">Pulse</span>
        </span>
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
        <Link href="/intake" className="hover:text-slate-950 transition-colors flex items-center gap-1">
          <Sparkles className="w-4 h-4 text-amber-500 animate-pulse" />
          Adaptive Intake
        </Link>
      </nav>

      <div>
        <Link
          href="/intake"
          className="group relative inline-flex items-center justify-center p-0.5 overflow-hidden text-xs md:text-sm font-semibold text-slate-900 rounded-full bg-slate-200 hover:bg-slate-300 transition-all duration-300"
        >
          <span className="relative px-5 py-2 transition-all ease-in duration-75 bg-white rounded-full group-hover:bg-slate-50 flex items-center gap-2">
            Start Assessment
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </span>
        </Link>
      </div>
    </header>
  );
}

"use client";

import Link from "next/link";

export default function Footer() {
  return (
    <footer className="py-12 px-6 md:px-12 border-t border-slate-100 bg-white text-[11px] text-slate-500 w-full relative z-10">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-slate-900 flex items-center justify-center text-white font-bold text-xs">
            C
          </div>
          <span className="font-bold text-slate-800">CalmPulse</span>
        </div>
        
        <div className="text-center md:text-left text-slate-400">
          © 2026 CalmPulse. AI-Adaptive Behavioral Pacing & Peer Support Engine.
        </div>
        
        <div className="flex gap-6 font-semibold">
          <Link href="#" className="hover:text-slate-800 transition-colors">
            Privacy Policy
          </Link>
          <Link href="#" className="hover:text-slate-800 transition-colors">
            Terms of Service
          </Link>
        </div>
      </div>
    </footer>
  );
}

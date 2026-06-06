"use client";

import { ReactNode } from "react";

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  hoverLift?: boolean;
  animation?: "float" | "float-slow" | "float-fast" | "fade-in" | "none";
  onClick?: () => void;
}

export default function GlassCard({
  children,
  className = "",
  hoverLift = false,
  animation = "none",
  onClick
}: GlassCardProps) {
  const baseClass = "glass-panel border border-slate-200/50 rounded-3xl p-6 bg-white";
  
  const hoverClass = hoverLift ? "hover-lift" : "";
  
  let animClass = "";
  if (animation === "float") animClass = "animate-float";
  else if (animation === "float-slow") animClass = "animate-float-slow";
  else if (animation === "float-fast") animClass = "animate-float-fast";
  else if (animation === "fade-in") animClass = "animate-fade-in";

  const cursorClass = onClick ? "cursor-pointer" : "";

  return (
    <div
      onClick={onClick}
      className={`${baseClass} ${hoverClass} ${animClass} ${cursorClass} ${className}`}
    >
      {children}
    </div>
  );
}

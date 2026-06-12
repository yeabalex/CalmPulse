"use client";

interface TensionDialProps {
  score: number;
  size?: "sm" | "md";
}

export default function TensionDial({ score, size = "sm" }: TensionDialProps) {
  const isSmall = size === "sm";
  
  // Dimensions based on size
  const svgSize = isSmall ? "w-16 h-16" : "w-36 h-36";
  const cx = isSmall ? 32 : 72;
  const cy = isSmall ? 32 : 72;
  const r = isSmall ? 26 : 58;
  const strokeWidthBg = isSmall ? 5 : 9;
  const strokeWidthFg = isSmall ? 5 : 10;
  
  // Circumference
  const circ = 2 * Math.PI * r;
  const strokeOffset = circ - (circ * score) / 10;
  const label = score >= 7 ? "High support" : score >= 5 ? "Some support" : "Steady";

  return (
    <div className="flex flex-col items-center justify-center text-center">
      <span className={`font-bold text-slate-500 uppercase tracking-wider block ${
        isSmall ? "text-[9px] mb-2" : "text-[10px] mb-3"
      }`}>
        Stress Check
      </span>
      <div className={`relative ${svgSize} flex items-center justify-center`}>
        <svg className="w-full h-full transform -rotate-90">
          <circle
            cx={cx}
            cy={cy}
            r={r}
            className="stroke-slate-100"
            strokeWidth={strokeWidthBg}
            fill="transparent"
          />
          <circle
            cx={cx}
            cy={cy}
            r={r}
            className="stroke-slate-900"
            strokeWidth={strokeWidthFg}
            fill="transparent"
            strokeDasharray={circ}
            strokeDashoffset={strokeOffset}
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute flex flex-col items-center justify-center">
          <span className={`font-extrabold text-slate-900 max-w-[70px] leading-tight ${
            isSmall ? "text-xs" : "text-lg"
          }`}>
            {label}
          </span>
          {!isSmall && (
            <span className="text-[10px] font-bold text-slate-400 uppercase">today</span>
          )}
        </div>
      </div>
    </div>
  );
}

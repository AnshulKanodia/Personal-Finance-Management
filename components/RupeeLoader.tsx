"use client";

import React from "react";
import { IndianRupee } from "lucide-react";

interface RupeeLoaderProps {
  label?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export const RupeeLoader: React.FC<RupeeLoaderProps> = ({
  label,
  size = "md",
  className = "",
}) => {
  const containerSize =
    size === "sm" ? "w-10 h-10" : size === "lg" ? "w-20 h-20" : "w-14 h-14";
  const iconSize =
    size === "sm" ? "w-5 h-5" : size === "lg" ? "w-9 h-9" : "w-7 h-7";
  const textSize =
    size === "sm" ? "text-[11px]" : size === "lg" ? "text-sm" : "text-xs";

  return (
    <div
      className={`flex flex-col items-center justify-center py-6 text-center select-none animate-in fade-in duration-300 ${className}`}
    >
      <div className={`relative ${containerSize} flex items-center justify-center mb-3`}>
        {/* Subtle spinning outer accent ring */}
        <div className="absolute inset-0 rounded-2xl border-2 border-emerald-500/20 border-t-emerald-400 animate-spin" />
        
        {/* Inner emerald backdrop with normal Indian Rupee logo */}
        <div className="w-[82%] h-[82%] rounded-xl bg-gradient-to-tr from-emerald-500/15 to-sky-500/10 border border-emerald-500/30 flex items-center justify-center shadow-[0_0_20px_rgba(16,185,129,0.25)]">
          <IndianRupee className={`${iconSize} text-emerald-400 animate-pulse stroke-[2.2]`} />
        </div>
      </div>

      {label && (
        <span className={`${textSize} text-zinc-400 font-medium tracking-wide`}>
          {label}
        </span>
      )}
    </div>
  );
};

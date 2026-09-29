"use client";

import React from "react";
import { usePreferences } from "@/lib/preferences";

interface PrivacyMaskProps {
  children: React.ReactNode;
  className?: string;
  maskText?: string;
}

export const PrivacyMask: React.FC<PrivacyMaskProps> = ({
  children,
  className = "",
  maskText,
}) => {
  const { prefs, mounted } = usePreferences();

  if (!mounted || !prefs.stealthMode) {
    return <span className={className}>{children}</span>;
  }

  if (maskText) {
    return (
      <span className={`font-mono tracking-widest text-zinc-400 select-none ${className}`}>
        {maskText}
      </span>
    );
  }

  // Extract sign and rupee prefix if present in text
  const textContent =
    typeof children === "string" || typeof children === "number" ? String(children) : "";
  const hasRupee = textContent.includes("₹");
  const isPositive = textContent.startsWith("+");
  const isNegative = textContent.startsWith("-");
  const sign = isPositive ? "+" : isNegative ? "-" : "";

  return (
    <span
      className={`inline-flex items-center gap-1 select-none font-mono tracking-wider text-emerald-400/90 bg-emerald-500/10 px-1.5 py-0.5 rounded-lg border border-emerald-500/20 text-[0.88em] ${className}`}
      title="Stealth Mode Active (Pixelated) • Tap eye in navbar to reveal"
    >
      {sign && <span className="font-bold">{sign}</span>}
      {hasRupee && <span className="font-bold">₹</span>}
      <span className="tracking-[0.2em] font-extrabold text-[0.75em] text-emerald-300">
        ■■■■■
      </span>
    </span>
  );
};

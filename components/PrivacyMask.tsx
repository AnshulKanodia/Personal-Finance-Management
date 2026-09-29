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

  return (
    <span
      className={`select-none filter blur-[6px] opacity-70 transition-all duration-200 ${className}`}
      title="Hidden in Stealth Mode (tap eye to toggle)"
    >
      {children}
    </span>
  );
};

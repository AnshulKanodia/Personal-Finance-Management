"use client";

import { useState, useEffect } from "react";

export interface DashboardPreferences {
  stealthMode: boolean;
  showSpendingVelocity: boolean;
  velocityPeriod: "WEEKLY" | "MONTHLY";
  showCategoryChart: boolean;
  showPaymentChannels: boolean;
  showRecentTransactions: boolean;
  biometricEnabled: boolean;
}

export const DEFAULT_PREFERENCES: DashboardPreferences = {
  stealthMode: false,
  showSpendingVelocity: true,
  velocityPeriod: "WEEKLY",
  showCategoryChart: true,
  showPaymentChannels: true,
  showRecentTransactions: true,
  biometricEnabled: false,
};

const STORAGE_KEY = "rupeepulse_dashboard_prefs";

export function getPreferences(): DashboardPreferences {
  if (typeof window === "undefined") return DEFAULT_PREFERENCES;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_PREFERENCES;
    return { ...DEFAULT_PREFERENCES, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_PREFERENCES;
  }
}

export function savePreferences(prefs: DashboardPreferences): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
    window.dispatchEvent(new CustomEvent("rupeepulse_prefs_updated", { detail: prefs }));
  } catch (e) {
    console.error("Failed to save preferences:", e);
  }
}

export function updatePreferences(partial: Partial<DashboardPreferences>): DashboardPreferences {
  const current = getPreferences();
  const updated = { ...current, ...partial };
  savePreferences(updated);
  return updated;
}

export function toggleStealthMode(): boolean {
  const current = getPreferences();
  const next = !current.stealthMode;
  updatePreferences({ stealthMode: next });
  return next;
}

export function usePreferences() {
  const [prefs, setPrefs] = useState<DashboardPreferences>(DEFAULT_PREFERENCES);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setPrefs(getPreferences());
    setMounted(true);

    const handler = (e: any) => {
      if (e.detail) {
        setPrefs(e.detail);
      } else {
        setPrefs(getPreferences());
      }
    };

    window.addEventListener("rupeepulse_prefs_updated", handler);
    return () => window.removeEventListener("rupeepulse_prefs_updated", handler);
  }, []);

  return { prefs, mounted, update: updatePreferences, toggleStealth: toggleStealthMode };
}

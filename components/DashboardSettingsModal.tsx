"use client";

import React, { useState } from "react";
import {
  X,
  Gauge,
  PieChart,
  CreditCard,
  Clock,
  Eye,
  Calendar,
  Lock,
  ShieldCheck,
  Fingerprint,
  Sliders,
  Check,
} from "lucide-react";
import { usePreferences, DashboardPreferences } from "@/lib/preferences";
import { enrollBiometrics } from "@/lib/webauthn";

interface DashboardSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DashboardSettingsModal: React.FC<DashboardSettingsModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { prefs, update } = usePreferences();
  const [enrollingBiometric, setEnrollingBiometric] = useState(false);
  const [enrollPin, setEnrollPin] = useState("");
  const [enrollError, setEnrollError] = useState("");
  const [enrollLoading, setEnrollLoading] = useState(false);

  if (!isOpen) return null;

  const handleToggle = (key: keyof DashboardPreferences) => {
    if (key === "biometricEnabled") {
      if (!prefs.biometricEnabled) {
        setEnrollingBiometric(true);
        setEnrollPin("");
        setEnrollError("");
        return;
      } else {
        localStorage.removeItem("rupeepulse_biometric_token");
        update({ biometricEnabled: false });
        return;
      }
    }
    update({ [key]: !prefs[key] });
  };

  const handleEnrollBiometrics = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!enrollPin || enrollPin.length < 4) {
      setEnrollError("Please enter your vault PIN");
      return;
    }
    try {
      setEnrollLoading(true);
      setEnrollError("");

      const res = await fetch("/api/auth/biometric", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin: enrollPin }),
      });

      const data = await res.json();
      if (!data.success) {
        setEnrollError(data.message || "Incorrect PIN code");
        return;
      }

      await enrollBiometrics();
      localStorage.setItem("rupeepulse_biometric_token", data.biometricToken);
      update({ biometricEnabled: true });
      setEnrollingBiometric(false);
    } catch (err: any) {
      setEnrollError(err.message || "Failed to register biometrics");
    } finally {
      setEnrollLoading(false);
    }
  };

  const setVelocityPeriod = (period: "WEEKLY" | "MONTHLY") => {
    update({ velocityPeriod: period });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-3xl bg-zinc-950 border border-zinc-800 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-zinc-850 flex items-center justify-between bg-zinc-900/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-600 to-sky-500 p-0.5 flex items-center justify-center shadow-[0_0_15px_rgba(16,185,129,0.25)]">
              <div className="w-full h-full bg-zinc-950 rounded-[14px] flex items-center justify-center">
                <Sliders className="w-4 h-4 text-emerald-400" />
              </div>
            </div>
            <div>
              <h3 className="text-base font-bold text-zinc-100 flex items-center gap-2">
                <span>Dashboard & Preferences</span>
              </h3>
              <p className="text-xs text-zinc-400 mt-0.5">
                Turn features on or off to personalize your vault view
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-zinc-400 hover:text-zinc-200 hover:bg-zinc-850 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6">
          {/* Section 1: Dashboard Widgets */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider font-mono">
                Dashboard Widgets
              </span>
              <span className="text-[10px] text-emerald-400 font-mono">Real-time sync</span>
            </div>

            {/* Spending Velocity */}
            <div className="p-3.5 rounded-2xl bg-zinc-900/60 border border-zinc-800 space-y-3 transition-colors hover:border-zinc-700">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                    <Gauge className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-zinc-100">Spending Velocity Gauge</div>
                    <div className="text-[11px] text-zinc-400">
                      Shows whether spending pace is faster or slower vs past benchmarks
                    </div>
                  </div>
                </div>

                {/* Toggle switch */}
                <button
                  type="button"
                  onClick={() => handleToggle("showSpendingVelocity")}
                  className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors ${
                    prefs.showSpendingVelocity ? "bg-emerald-500" : "bg-zinc-800"
                  }`}
                >
                  <div
                    className={`bg-zinc-950 w-4 h-4 rounded-full shadow-md transform transition-transform ${
                      prefs.showSpendingVelocity ? "translate-x-5" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>

              {/* Sub-option: Weekly vs Monthly period */}
              {prefs.showSpendingVelocity && (
                <div className="pt-2.5 border-t border-zinc-850 flex items-center justify-between">
                  <span className="text-xs text-zinc-400 flex items-center gap-1.5 font-medium">
                    <Calendar className="w-3.5 h-3.5 text-zinc-500" />
                    Velocity Comparison Period:
                  </span>
                  <div className="inline-flex rounded-xl bg-zinc-950 p-1 border border-zinc-800 text-xs">
                    <button
                      type="button"
                      onClick={() => setVelocityPeriod("WEEKLY")}
                      className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                        prefs.velocityPeriod === "WEEKLY"
                          ? "bg-emerald-500 text-zinc-950 font-bold shadow-sm"
                          : "text-zinc-400 hover:text-zinc-200"
                      }`}
                    >
                      Weekly
                    </button>
                    <button
                      type="button"
                      onClick={() => setVelocityPeriod("MONTHLY")}
                      className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                        prefs.velocityPeriod === "MONTHLY"
                          ? "bg-emerald-500 text-zinc-950 font-bold shadow-sm"
                          : "text-zinc-400 hover:text-zinc-200"
                      }`}
                    >
                      Monthly
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Spend by Category */}
            <div className="p-3.5 rounded-2xl bg-zinc-900/60 border border-zinc-800 flex items-center justify-between transition-colors hover:border-zinc-700">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400">
                  <PieChart className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-zinc-100">Spend by Category</div>
                  <div className="text-[11px] text-zinc-400">
                    Category distribution donut chart with percentage breakdown
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleToggle("showCategoryChart")}
                className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors ${
                  prefs.showCategoryChart ? "bg-emerald-500" : "bg-zinc-800"
                }`}
              >
                <div
                  className={`bg-zinc-950 w-4 h-4 rounded-full shadow-md transform transition-transform ${
                    prefs.showCategoryChart ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>

            {/* Payment Channels */}
            <div className="p-3.5 rounded-2xl bg-zinc-900/60 border border-zinc-800 flex items-center justify-between transition-colors hover:border-zinc-700">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
                  <CreditCard className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-zinc-100">Payment Channels</div>
                  <div className="text-[11px] text-zinc-400">
                    UPI, Cash, and Card/NetBanking cashflow splits
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleToggle("showPaymentChannels")}
                className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors ${
                  prefs.showPaymentChannels ? "bg-emerald-500" : "bg-zinc-800"
                }`}
              >
                <div
                  className={`bg-zinc-950 w-4 h-4 rounded-full shadow-md transform transition-transform ${
                    prefs.showPaymentChannels ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>

            {/* Recent Transactions */}
            <div className="p-3.5 rounded-2xl bg-zinc-900/60 border border-zinc-800 flex items-center justify-between transition-colors hover:border-zinc-700">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-zinc-100">Recent Transactions</div>
                  <div className="text-[11px] text-zinc-400">
                    Latest 5 entries across categories with 1-click edit
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleToggle("showRecentTransactions")}
                className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors ${
                  prefs.showRecentTransactions ? "bg-emerald-500" : "bg-zinc-800"
                }`}
              >
                <div
                  className={`bg-zinc-950 w-4 h-4 rounded-full shadow-md transform transition-transform ${
                    prefs.showRecentTransactions ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Section 2: Privacy & Security */}
          <div className="space-y-3 pt-2">
            <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider font-mono">
              Privacy & Security
            </span>

            {/* Stealth Mode */}
            <div className="p-3.5 rounded-2xl bg-zinc-900/60 border border-zinc-800 flex items-center justify-between transition-colors hover:border-zinc-700">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400">
                  <Eye className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-zinc-100">Stealth Mode (Privacy Blur)</div>
                  <div className="text-[11px] text-zinc-400">
                    Mask balances with a privacy blur in public or when screen sharing
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleToggle("stealthMode")}
                className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors ${
                  prefs.stealthMode ? "bg-emerald-500" : "bg-zinc-800"
                }`}
              >
                <div
                  className={`bg-zinc-950 w-4 h-4 rounded-full shadow-md transform transition-transform ${
                    prefs.stealthMode ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>

            {/* Biometric Unlock */}
            <div className="p-3.5 rounded-2xl bg-zinc-900/60 border border-zinc-800 flex items-center justify-between transition-colors hover:border-zinc-700">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                  <Fingerprint className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-zinc-100">Biometric Unlock</div>
                  <div className="text-[11px] text-zinc-400">
                    Allow unlocking vault via Fingerprint or FaceID on supported devices
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleToggle("biometricEnabled")}
                className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors ${
                  prefs.biometricEnabled ? "bg-emerald-500" : "bg-zinc-800"
                }`}
              >
                <div
                  className={`bg-zinc-950 w-4 h-4 rounded-full shadow-md transform transition-transform ${
                    prefs.biometricEnabled ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        {/* Biometric PIN Enrollment Dialog */}
        {enrollingBiometric && (
          <div className="absolute inset-0 z-20 bg-zinc-950/95 backdrop-blur-md p-6 flex flex-col justify-center items-center text-center animate-in fade-in duration-200">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 mb-3 shadow-[0_0_20px_rgba(99,102,241,0.25)]">
              <Fingerprint className="w-6 h-6 stroke-[2.2]" />
            </div>
            <h4 className="text-base font-bold text-zinc-100">Enable Biometric Unlock</h4>
            <p className="text-xs text-zinc-400 mt-1 max-w-xs">
              Confirm your 6-digit numeric vault PIN to register hardware fingerprint or FaceID sensor
            </p>

            <form onSubmit={handleEnrollBiometrics} className="mt-4 w-full max-w-xs space-y-3">
              {enrollError && (
                <div className="text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 py-1.5 px-3 rounded-xl font-medium">
                  {enrollError}
                </div>
              )}

              <input
                type="password"
                maxLength={6}
                autoFocus
                placeholder="Enter PIN"
                value={enrollPin}
                onChange={(e) => setEnrollPin(e.target.value)}
                className="w-full text-center tracking-[0.4em] text-xl font-bold py-2.5 px-4 bg-zinc-900 border border-zinc-700 rounded-xl text-zinc-100 focus:outline-none focus:border-indigo-500 transition-colors"
              />

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEnrollingBiometric(false)}
                  className="flex-1 py-2.5 rounded-xl border border-zinc-800 bg-zinc-900 text-xs font-medium text-zinc-400 hover:text-zinc-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={enrollLoading || enrollPin.length < 4}
                  className="flex-1 py-2.5 rounded-xl bg-indigo-500 hover:bg-indigo-400 text-zinc-950 font-bold text-xs transition-all shadow-[0_0_15px_rgba(99,102,241,0.3)] disabled:opacity-50"
                >
                  {enrollLoading ? "Registering..." : "Enable"}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Footer */}
        <div className="p-4 border-t border-zinc-850 flex items-center justify-between bg-zinc-900/30 text-xs">
          <div className="text-zinc-500 flex items-center gap-1.5">
            <Check className="w-3.5 h-3.5 text-emerald-400" />
            <span>Preferences saved automatically</span>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-xs transition-all active:scale-95 shadow-sm"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

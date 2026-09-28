"use client";

import React, { useState, useEffect } from "react";
import { Lock, Unlock, IndianRupee, Delete, ArrowRight, ShieldCheck, Sparkles } from "lucide-react";

import { Starfield } from "./Starfield";

interface VaultLockScreenProps {
  onUnlock: () => void;
}

export const VaultLockScreen: React.FC<VaultLockScreenProps> = ({ onUnlock }) => {
  const [pin, setPin] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [isSuccess, setIsSuccess] = useState<boolean>(false);

  const handleDigit = (digit: string) => {
    if (loading || isSuccess) return;
    if (pin.length < 6) {
      const nextPin = pin + digit;
      setPin(nextPin);
      setError("");
      if (nextPin.length === 6) {
        attemptUnlock(nextPin);
      }
    }
  };

  const handleDelete = () => {
    if (loading || isSuccess) return;
    setPin((prev) => prev.slice(0, -1));
    setError("");
  };

  const handleClear = () => {
    if (loading || isSuccess) return;
    setPin("");
    setError("");
  };

  const attemptUnlock = async (inputPin: string) => {
    if (!inputPin) return;
    try {
      setLoading(true);
      setError("");

      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin: inputPin }),
      });

      const data = await res.json();
      if (!data.success) {
        setError(data.message || "Incorrect PIN code");
        setPin("");
        return;
      }

      setIsSuccess(true);
      setTimeout(() => {
        onUnlock();
      }, 400);
    } catch (err: any) {
      setError(err.message || "Failed to verify PIN");
      setPin("");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key >= "0" && e.key <= "9") {
        handleDigit(e.key);
      } else if (e.key === "Backspace") {
        handleDelete();
      } else if (e.key === "Enter" && pin.length >= 6) {
        attemptUnlock(pin);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [pin, loading, isSuccess]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#050507] select-none">
      {/* Moving stars in cosmic night sky */}
      <Starfield />

      <div className="relative w-full max-w-sm flex flex-col items-center z-10 animate-in fade-in zoom-in-95 duration-300">
        {/* Brand Header */}
        <div className="flex flex-col items-center mb-6 text-center">
          <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-500 via-sky-500 to-indigo-500 p-0.5 shadow-[0_0_35px_rgba(16,185,129,0.35)] mb-3 transition-transform hover:scale-105">
            <div className="w-full h-full bg-[#09090d] rounded-[14px] flex items-center justify-center">
              {isSuccess ? (
                <Unlock className="w-8 h-8 text-emerald-400 animate-in zoom-in duration-200" />
              ) : (
                <IndianRupee className="w-8 h-8 text-emerald-400" />
              )}
            </div>
          </div>
          <h1 className="text-2xl font-black tracking-tight bg-gradient-to-r from-zinc-100 via-zinc-200 to-zinc-400 bg-clip-text text-transparent">
            RupeePulse
          </h1>
          <div className="flex items-center gap-1.5 mt-1 text-xs text-zinc-400">
            <Lock className="w-3 h-3 text-emerald-400" />
            <span>Vault Locked</span>
            <span>•</span>
            <span className="text-[11px] text-zinc-500 font-mono">Auto-locks on reload</span>
          </div>
        </div>

        {/* PIN Glass Panel */}
        <div className="w-full glass-panel rounded-3xl p-6 sm:p-7 shadow-2xl flex flex-col items-center relative overflow-hidden">
          {/* Top highlight gradient line */}
          <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-emerald-500/50 to-transparent" />

          {/* PIN Indicators */}
          <div className="flex items-center justify-center gap-2.5 my-4">
            {[0, 1, 2, 3, 4, 5].map((idx) => {
              const isFilled = pin.length > idx;
              return (
                <div
                  key={idx}
                  className={`w-3.5 h-3.5 rounded-full transition-all duration-200 ${
                    isFilled
                      ? "bg-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.9)] scale-110"
                      : "border-2 border-zinc-700/80 bg-zinc-900/60"
                  }`}
                />
              );
            })}
          </div>

          {/* Status Message */}
          {error ? (
            <div className="mb-3 text-xs font-semibold text-rose-400 bg-rose-500/10 border border-rose-500/20 px-3 py-1.5 rounded-xl text-center w-full animate-shake">
              {error}
            </div>
          ) : isSuccess ? (
            <div className="mb-3 text-xs font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-xl text-center w-full flex items-center justify-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Vault Unlocked!</span>
            </div>
          ) : (
            <div className="mb-3 text-[11px] text-zinc-400 text-center">
              Enter 6-digit PIN code
            </div>
          )}

          {/* Keypad */}
          <div className="grid grid-cols-3 gap-2.5 w-full max-w-[260px]">
            {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((num) => (
              <button
                key={num}
                type="button"
                onClick={() => handleDigit(num)}
                disabled={loading || isSuccess}
                className="h-13 rounded-2xl bg-zinc-900/70 hover:bg-zinc-800 border border-white/[0.06] hover:border-emerald-500/30 text-lg font-bold text-zinc-100 active:scale-95 active:bg-emerald-500/10 transition-all flex items-center justify-center shadow-sm"
              >
                {num}
              </button>
            ))}

            <button
              type="button"
              onClick={handleClear}
              disabled={loading || pin.length === 0 || isSuccess}
              className="h-13 rounded-2xl bg-zinc-900/40 hover:bg-zinc-850 border border-white/[0.04] text-xs font-medium text-zinc-500 hover:text-zinc-300 active:scale-95 transition-all flex items-center justify-center"
            >
              Clear
            </button>

            <button
              type="button"
              onClick={() => handleDigit("0")}
              disabled={loading || isSuccess}
              className="h-13 rounded-2xl bg-zinc-900/70 hover:bg-zinc-800 border border-white/[0.06] hover:border-emerald-500/30 text-lg font-bold text-zinc-100 active:scale-95 active:bg-emerald-500/10 transition-all flex items-center justify-center shadow-sm"
            >
              0
            </button>

            <button
              type="button"
              onClick={handleDelete}
              disabled={loading || pin.length === 0 || isSuccess}
              className="h-13 rounded-2xl bg-zinc-900/40 hover:bg-zinc-850 border border-white/[0.04] text-zinc-400 hover:text-zinc-200 active:scale-95 transition-all flex items-center justify-center"
            >
              <Delete className="w-5 h-5" />
            </button>
          </div>

          <div className="mt-5 text-center">
            <span className="text-[11px] text-zinc-600 flex items-center justify-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-zinc-500" />
              <span>Private Vault Encrypted</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Lock, IndianRupee, Delete, ArrowRight } from "lucide-react";
import { Starfield } from "@/components/Starfield";
import { RupeeLoader } from "@/components/RupeeLoader";

function LoginForm() {
  const [pin, setPin] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectFrom = searchParams.get("from") || "/";

  // Check if already authenticated
  useEffect(() => {
    fetch("/api/auth/check")
      .then((res) => res.json())
      .then((data) => {
        if (data.authenticated) {
          router.replace(redirectFrom);
        }
      })
      .catch(() => {});
  }, [redirectFrom, router]);

  const handleDigit = (digit: string) => {
    if (pin.length < 8) {
      const nextPin = pin + digit;
      setPin(nextPin);
      setError("");
      // Auto-submit if 6 digits
      if (nextPin.length === 6) {
        attemptLogin(nextPin);
      }
    }
  };

  const handleDelete = () => {
    setPin((prev) => prev.slice(0, -1));
    setError("");
  };

  const handleClear = () => {
    setPin("");
    setError("");
  };

  const attemptLogin = async (inputPin: string) => {
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
        setError(data.message || "Invalid PIN code");
        setPin("");
        return;
      }

      const now = Date.now();
      sessionStorage.setItem("rupeepulse_unlocked", "true");
      sessionStorage.setItem("rupeepulse_last_active", now.toString());
      localStorage.setItem("rupeepulse_last_active", now.toString());

      router.replace(redirectFrom);
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Authentication failed");
      setPin("");
    } finally {
      setLoading(false);
    }
  };

  // Support hardware keyboard input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key >= "0" && e.key <= "9") {
        handleDigit(e.key);
      } else if (e.key === "Backspace") {
        handleDelete();
      } else if (e.key === "Enter" && pin.length >= 6) {
        attemptLogin(pin);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [pin]);

  return (
    <div className="w-full max-w-sm flex flex-col items-center">
      {/* App Logo & Header */}
      <div className="flex flex-col items-center mb-8 text-center">
        <div className="w-16 h-16 rounded-2xl bg-zinc-900 border border-emerald-500/40 p-0.5 shadow-[0_0_30px_rgba(16,185,129,0.3)] mb-4">
          <div className="w-full h-full bg-[#08080c] rounded-[14px] flex items-center justify-center">
            <IndianRupee className="w-8 h-8 text-emerald-400 stroke-[2.2]" />
          </div>
        </div>
        <h1 className="text-2xl font-black tracking-tight text-zinc-100">RupeePulse</h1>
        <p className="text-xs text-zinc-400 mt-1">Private Personal Finance Vault</p>
      </div>

      {/* PIN Container Card */}
      <div className="w-full rounded-3xl bg-zinc-900/60 backdrop-blur-xl border border-zinc-800/80 p-6 sm:p-8 shadow-2xl flex flex-col items-center">
        <div className="flex items-center gap-1.5 text-xs text-zinc-400 mb-6">
          <Lock className="w-3.5 h-3.5 text-emerald-400" />
          <span>Enter 6-Digit PIN</span>
        </div>

        {/* PIN Indicators */}
        <div className="flex items-center justify-center gap-2.5 mb-6">
          {[0, 1, 2, 3, 4, 5].map((idx) => {
            const isFilled = pin.length > idx;
            return (
              <div
                key={idx}
                className={`w-3.5 h-3.5 rounded-full transition-all duration-200 ${
                  isFilled
                    ? "bg-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.8)] scale-110"
                    : "border-2 border-zinc-700 bg-zinc-900"
                }`}
              />
            );
          })}
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 text-xs font-semibold text-rose-400 bg-rose-500/10 border border-rose-500/20 px-3 py-1.5 rounded-xl text-center w-full">
            {error}
          </div>
        )}

        {/* Keypad */}
        <div className="grid grid-cols-3 gap-2.5 sm:gap-3.5 w-full max-w-[280px] sm:max-w-[320px]">
          {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((num) => (
            <button
              key={num}
              type="button"
              onClick={() => handleDigit(num)}
              disabled={loading}
              className="h-14 sm:h-16 rounded-2xl bg-zinc-900/80 border border-zinc-800 text-2xl sm:text-3xl font-bold text-zinc-100 hover:bg-zinc-800 hover:border-zinc-700 active:scale-95 active:bg-zinc-700 transition-all flex items-center justify-center shadow-md select-none touch-manipulation"
            >
              {num}
            </button>
          ))}

          <button
            type="button"
            onClick={handleClear}
            disabled={loading || pin.length === 0}
            className="h-14 sm:h-16 rounded-2xl bg-zinc-900/40 border border-zinc-800/80 text-xs sm:text-sm font-bold uppercase tracking-wider text-zinc-400 hover:text-zinc-200 hover:bg-zinc-850 active:scale-95 transition-all flex items-center justify-center select-none touch-manipulation disabled:opacity-40"
          >
            Clear
          </button>

          <button
            type="button"
            onClick={() => handleDigit("0")}
            disabled={loading}
            className="h-14 sm:h-16 rounded-2xl bg-zinc-900/80 border border-zinc-800 text-2xl sm:text-3xl font-bold text-zinc-100 hover:bg-zinc-800 hover:border-zinc-700 active:scale-95 active:bg-zinc-700 transition-all flex items-center justify-center shadow-md select-none touch-manipulation"
          >
            0
          </button>

          <button
            type="button"
            onClick={handleDelete}
            disabled={loading || pin.length === 0}
            className="h-14 sm:h-16 rounded-2xl bg-zinc-900/40 border border-zinc-800/80 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-850 active:scale-95 transition-all flex items-center justify-center select-none touch-manipulation disabled:opacity-40"
          >
            <Delete className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
        </div>

        {/* Submit button for custom length PINs */}
        {pin.length > 4 && (
          <button
            type="button"
            onClick={() => attemptLogin(pin)}
            disabled={loading}
            className="mt-5 w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-[0_0_15px_rgba(16,185,129,0.3)]"
          >
            <span>Unlock Vault</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        )}

        <div className="mt-6 text-center">
          <span className="text-[11px] text-zinc-600">
            Private Vault Protected
          </span>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#050507] relative overflow-hidden select-none">
      <Starfield />
      <div className="relative z-10 w-full flex justify-center">
        <Suspense fallback={<RupeeLoader size="sm" label="Loading secure vault..." />}>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}

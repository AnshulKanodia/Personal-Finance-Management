"use client";

import React, { useState, useEffect } from "react";
import { X, Check, IndianRupee, ArrowRight, ShieldCheck, CheckCircle2 } from "lucide-react";
import { formatINR } from "@/lib/utils";

interface Category {
  _id: string;
  name: string;
  color: string;
}

interface SettleUpModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  friend: {
    _id: string;
    name: string;
    phone?: string;
    toGive: number;
    toTake: number;
    netBalance: number;
    unsettledCount: number;
  } | null;
}

export const SettleUpModal: React.FC<SettleUpModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  friend,
}) => {
  const [logToTracker, setLogToTracker] = useState(true);
  const [paymentMode, setPaymentMode] = useState<"UPI" | "CASH">("UPI");
  const [categoryId, setCategoryId] = useState<string>("");
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    if (isOpen) {
      fetchCategories();
    }
  }, [isOpen]);

  const fetchCategories = async () => {
    try {
      const res = await fetch("/api/categories");
      const json = await res.json();
      if (json.success && json.data.length > 0) {
        setCategories(json.data);
        const defaultCat =
          json.data.find((c: Category) => c.name.toLowerCase().includes("upi")) ||
          json.data.find((c: Category) => c.name.toLowerCase().includes("other")) ||
          json.data[0];
        if (defaultCat) setCategoryId(defaultCat._id);
      }
    } catch (e) {
      console.error("Failed to load categories", e);
    }
  };

  if (!isOpen || !friend) return null;

  const net = friend.netBalance; // Positive = friend owes me, Negative = I owe friend
  const absNet = Math.abs(net);
  const isSettledNeutral = net === 0;

  const handleSettle = async () => {
    try {
      setLoading(true);
      setError("");

      const res = await fetch("/api/dues/settle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          friendId: friend._id,
          logToTracker: logToTracker && !isSettledNeutral,
          categoryId: categoryId || undefined,
          paymentMode,
        }),
      });

      const json = await res.json();
      if (!json.success) {
        setError(json.message || "Failed to settle dues");
        return;
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to process settlement");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-md rounded-2xl bg-zinc-950 border border-zinc-800 shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-zinc-850 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            <span className="text-base font-bold text-zinc-100">Settle Up Khaata</span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/80 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-5">
          {error && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-medium">
              {error}
            </div>
          )}

          {/* Friend Profile & Balance Summary */}
          <div className="p-4 rounded-xl bg-zinc-900/70 border border-zinc-800 text-center">
            <h4 className="text-sm font-semibold text-zinc-300">{friend.name}</h4>
            <div className="mt-2 text-2xl sm:text-3xl font-black">
              {net > 0 && <span className="text-emerald-400">+{formatINR(absNet)}</span>}
              {net < 0 && <span className="text-rose-400">-{formatINR(absNet)}</span>}
              {net === 0 && <span className="text-zinc-400">₹0 (All Squared)</span>}
            </div>
            <p className="text-xs text-zinc-400 mt-1">
              {net > 0 && `${friend.name} will pay you ${formatINR(absNet)}`}
              {net < 0 && `You will pay ${friend.name} ${formatINR(absNet)}`}
              {net === 0 && "Balances are already balanced out."}
            </p>
            <div className="mt-3 text-[11px] text-zinc-500 font-mono">
              Unsettled entries: {friend.unsettledCount} (To Give: {formatINR(friend.toGive)} • To Take: {formatINR(friend.toTake)})
            </div>
          </div>

          {/* Option to log to Tracker */}
          {!isSettledNeutral && (
            <div className="p-4 rounded-xl bg-zinc-900/40 border border-zinc-850 space-y-3">
              <label className="flex items-start gap-3 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={logToTracker}
                  onChange={(e) => setLogToTracker(e.target.checked)}
                  className="mt-0.5 rounded border-zinc-700 text-emerald-500 focus:ring-emerald-500 focus:ring-offset-0 bg-zinc-900"
                />
                <div>
                  <span className="text-xs font-bold text-zinc-200">
                    Auto-log to Main Expense Tracker
                  </span>
                  <p className="text-[11px] text-zinc-400 mt-0.5">
                    Records {formatINR(absNet)} as{" "}
                    <span className={net > 0 ? "text-emerald-400 font-semibold" : "text-rose-400 font-semibold"}>
                      {net > 0 ? "Income (Received)" : "Expense (Paid)"}
                    </span>{" "}
                    in your tracker.
                  </p>
                </div>
              </label>

              {logToTracker && (
                <div className="pt-2 border-t border-zinc-800/80 space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="block text-[10px] uppercase font-bold text-zinc-400 mb-1">
                        Mode
                      </span>
                      <div className="grid grid-cols-2 gap-1">
                        <button
                          type="button"
                          onClick={() => setPaymentMode("UPI")}
                          className={`py-1.5 px-2 rounded-lg text-xs font-semibold border ${
                            paymentMode === "UPI"
                              ? "text-sky-400 border-sky-500/40 bg-sky-500/10"
                              : "border-zinc-800 text-zinc-400 bg-zinc-900"
                          }`}
                        >
                          UPI
                        </button>
                        <button
                          type="button"
                          onClick={() => setPaymentMode("CASH")}
                          className={`py-1.5 px-2 rounded-lg text-xs font-semibold border ${
                            paymentMode === "CASH"
                              ? "text-amber-400 border-amber-500/40 bg-amber-500/10"
                              : "border-zinc-800 text-zinc-400 bg-zinc-900"
                          }`}
                        >
                          Cash
                        </button>
                      </div>
                    </div>
                    <div>
                      <span className="block text-[10px] uppercase font-bold text-zinc-400 mb-1">
                        Category
                      </span>
                      <select
                        value={categoryId}
                        onChange={(e) => setCategoryId(e.target.value)}
                        className="w-full px-2 py-1.5 bg-zinc-900 border border-zinc-800 rounded-lg text-xs text-zinc-200 focus:outline-none focus:border-emerald-500"
                      >
                        {categories.map((c) => (
                          <option key={c._id} value={c._id}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Settle Button */}
          <button
            onClick={handleSettle}
            disabled={loading}
            className="w-full py-3 rounded-xl font-bold text-sm bg-gradient-to-r from-emerald-500 to-sky-400 hover:from-emerald-400 hover:to-sky-300 text-zinc-950 transition-all flex items-center justify-center gap-2 active:scale-98 shadow-[0_0_20px_rgba(16,185,129,0.3)]"
          >
            {loading ? (
              <span>Zeroing balance...</span>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
                <span>Zero Out & Settle Up Balance</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

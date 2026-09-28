"use client";

import React, { useState, useEffect } from "react";
import { X, Check, IndianRupee, Sparkles, Calendar, Tag, CreditCard } from "lucide-react";
import { CategoryIcon } from "./CategoryIcon";
import { clearCache } from "@/lib/clientCache";

interface Category {
  _id: string;
  name: string;
  color: string;
  icon: string;
}

interface QuickTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialType?: "EXPENSE" | "INCOME";
}

export const QuickTransactionModal: React.FC<QuickTransactionModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialType = "EXPENSE",
}) => {
  const [type, setType] = useState<"EXPENSE" | "INCOME">(initialType);
  const [amount, setAmount] = useState<string>("");
  const [paymentMode, setPaymentMode] = useState<"UPI" | "CASH" | "CARD" | "NET_BANKING">("UPI");
  const [categoryId, setCategoryId] = useState<string>("");
  const [categories, setCategories] = useState<Category[]>([]);
  const [notes, setNotes] = useState<string>("");
  const [date, setDate] = useState<string>(new Date().toISOString().split("T")[0]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    if (isOpen) {
      const activeType = initialType;
      setType(activeType);
      fetchCategories(activeType);
    }
  }, [isOpen, initialType]);

  const fetchCategories = async (activeType = type) => {
    try {
      const res = await fetch("/api/categories");
      const json = await res.json();
      if (json.success && json.data.length > 0) {
        const sorted = [...json.data].sort((a: Category, b: Category) =>
          a.name.localeCompare(b.name)
        );
        setCategories(sorted);

        const salary = sorted.find((c) => c.name.toLowerCase() === "salary");
        if (activeType === "INCOME") {
          if (salary) setCategoryId(salary._id);
        } else {
          const firstExp = sorted.find((c) => c.name.toLowerCase() !== "salary") || sorted[0];
          setCategoryId(firstExp._id);
        }
      }
    } catch (e) {
      console.error("Failed to fetch categories", e);
    }
  };

  const handleTypeToggle = (newType: "EXPENSE" | "INCOME") => {
    setType(newType);
    const salary = categories.find((c) => c.name.toLowerCase() === "salary");
    if (newType === "INCOME") {
      if (salary) setCategoryId(salary._id);
    } else {
      const firstExp = categories.find((c) => c.name.toLowerCase() !== "salary") || categories[0];
      if (firstExp) setCategoryId(firstExp._id);
    }
  };

  const salaryCategory = categories.find((c) => c.name.toLowerCase() === "salary");
  const displayCategories =
    type === "INCOME"
      ? salaryCategory
        ? [salaryCategory]
        : categories.filter((c) => c.name.toLowerCase().includes("salary"))
      : categories.filter((c) => c.name.toLowerCase() !== "salary");

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const numericAmount = parseFloat(amount);
    if (!numericAmount || numericAmount <= 0) {
      setError("Please enter a valid amount");
      return;
    }

    if (!categoryId) {
      setError("Please select a category");
      return;
    }

    try {
      setLoading(true);
      const res = await fetch("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: numericAmount,
          type,
          paymentMode,
          category: categoryId,
          notes,
          date,
        }),
      });

      const data = await res.json();
      if (!data.success) {
        setError(data.message || "Failed to add transaction");
        return;
      }

      // Reset, clear cache, notify listeners, and close
      clearCache();
      window.dispatchEvent(new CustomEvent("finance_data_updated"));
      setAmount("");
      setNotes("");
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const quickAmounts = [100, 200, 500, 1000, 2000];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-2xl bg-zinc-950 border border-zinc-800 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-zinc-850 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-base font-bold text-zinc-100">Quick Log</span>
            <span className="text-xs text-zinc-400 font-mono">INR</span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/80 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 overflow-y-auto space-y-5">
          {error && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-medium">
              {error}
            </div>
          )}

          {/* Type Toggle: Expense vs Income */}
          <div className="grid grid-cols-2 gap-2 p-1 bg-zinc-900 rounded-xl border border-zinc-800">
            <button
              type="button"
              onClick={() => handleTypeToggle("EXPENSE")}
              className={`py-2 rounded-lg text-xs font-bold transition-all ${
                type === "EXPENSE"
                  ? "bg-rose-500/20 text-rose-400 border border-rose-500/40 shadow-[0_0_15px_rgba(244,63,94,0.2)]"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              Expense (-₹)
            </button>
            <button
              type="button"
              onClick={() => handleTypeToggle("INCOME")}
              className={`py-2 rounded-lg text-xs font-bold transition-all ${
                type === "INCOME"
                  ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 shadow-[0_0_15px_rgba(16,185,129,0.2)]"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              Income (+₹)
            </button>
          </div>

          {/* Amount Input */}
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5">
              Amount (INR)
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl font-bold text-zinc-400">
                ₹
              </span>
              <input
                type="number"
                step="any"
                placeholder="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                autoFocus
                className={`w-full pl-10 pr-4 py-3 bg-zinc-900/80 border rounded-xl text-2xl font-extrabold focus:outline-none focus:ring-2 transition-all ${
                  type === "EXPENSE"
                    ? "border-rose-500/30 focus:border-rose-500 focus:ring-rose-500/20 text-rose-400"
                    : "border-emerald-500/30 focus:border-emerald-500 focus:ring-emerald-500/20 text-emerald-400"
                }`}
              />
            </div>

            {/* Quick Amount Chips */}
            <div className="flex items-center gap-1.5 mt-2 overflow-x-auto pb-1">
              {quickAmounts.map((q) => (
                <button
                  type="button"
                  key={q}
                  onClick={() => setAmount(q.toString())}
                  className="px-2.5 py-1 rounded-lg bg-zinc-900 border border-zinc-800 text-[11px] font-mono text-zinc-400 hover:text-zinc-200 hover:border-zinc-700 transition-colors"
                >
                  +{q}
                </button>
              ))}
            </div>
          </div>

          {/* Payment Mode Selector */}
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5">
              Payment Channel
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                {
                  id: "UPI",
                  label: "UPI Payments",
                  accent:
                    "text-sky-400 border-sky-500/40 bg-sky-500/10 shadow-[0_0_12px_rgba(14,165,233,0.2)]",
                },
                {
                  id: "CASH",
                  label: "Cash Payments",
                  accent:
                    "text-amber-400 border-amber-500/40 bg-amber-500/10 shadow-[0_0_12px_rgba(245,158,11,0.2)]",
                },
                {
                  id: "CARD",
                  label: "Card / NetBanking",
                  accent:
                    "text-violet-400 border-violet-500/40 bg-violet-500/10 shadow-[0_0_12px_rgba(139,92,246,0.2)]",
                },
              ].map((mode) => (
                <button
                  type="button"
                  key={mode.id}
                  onClick={() => setPaymentMode(mode.id as any)}
                  className={`py-2 px-2 rounded-xl text-xs font-semibold border transition-all text-center ${
                    paymentMode === mode.id
                      ? mode.accent
                      : "border-zinc-800 bg-zinc-900/60 text-zinc-400 hover:border-zinc-700"
                  }`}
                >
                  {mode.label}
                </button>
              ))}
            </div>
          </div>

          {/* Category Selector */}
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5">
              Category {type === "INCOME" ? "(Salary)" : "(Alphabetical)"}
            </label>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-40 overflow-y-auto pr-1">
              {displayCategories.map((cat) => {
                const isSelected = categoryId === cat._id;
                return (
                  <button
                    type="button"
                    key={cat._id}
                    onClick={() => setCategoryId(cat._id)}
                    className={`flex flex-col items-center justify-center p-2 rounded-xl border text-center transition-all ${
                      isSelected
                        ? "border-emerald-500/50 bg-emerald-500/10 text-zinc-100 shadow-[0_0_12px_rgba(16,185,129,0.2)]"
                        : "border-zinc-800 bg-zinc-900/50 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200"
                    }`}
                  >
                    <div
                      className="p-1.5 rounded-lg mb-1"
                      style={{
                        backgroundColor: `${cat.color}20`,
                        color: cat.color,
                      }}
                    >
                      <CategoryIcon name={cat.icon} className="w-4 h-4" />
                    </div>
                    <span className="text-[11px] font-medium truncate w-full">
                      {cat.name}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Date & Notes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1">
                Date
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-zinc-200 focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1">
                Notes / Remark
              </label>
              <input
                type="text"
                placeholder="e.g. Swiggy lunch, Petrol..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-zinc-200 focus:outline-none focus:border-emerald-500 placeholder:text-zinc-600"
              />
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3 rounded-xl font-bold text-sm text-zinc-950 transition-all flex items-center justify-center gap-2 active:scale-98 ${
                type === "EXPENSE"
                  ? "bg-gradient-to-r from-rose-500 to-rose-400 hover:from-rose-400 hover:to-rose-300 shadow-[0_0_20px_rgba(244,63,94,0.3)]"
                  : "bg-gradient-to-r from-emerald-500 to-emerald-400 hover:from-emerald-400 hover:to-emerald-300 shadow-[0_0_20px_rgba(16,185,129,0.3)]"
              }`}
            >
              {loading ? (
                <span>Recording...</span>
              ) : (
                <>
                  <Check className="w-4 h-4 stroke-[3]" />
                  <span>Save {type === "EXPENSE" ? "Expense" : "Income"}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

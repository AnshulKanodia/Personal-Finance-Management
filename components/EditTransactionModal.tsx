"use client";

import React, { useState, useEffect } from "react";
import { X, Trash2, Calendar, Tag, Check, IndianRupee } from "lucide-react";
import { CategoryIcon } from "./CategoryIcon";
import { clearCache } from "@/lib/clientCache";

interface Category {
  _id: string;
  name: string;
  color: string;
  icon: string;
}

interface TransactionItem {
  _id: string;
  amount: number;
  type: "EXPENSE" | "INCOME";
  paymentMode: "UPI" | "CASH" | "CARD" | "NET_BANKING";
  category: {
    _id: string;
    name: string;
    color: string;
    icon: string;
  } | string;
  notes?: string;
  date: string;
}

interface EditTransactionModalProps {
  isOpen: boolean;
  transaction: TransactionItem | null;
  onClose: () => void;
  onSuccess: () => void;
}

export const EditTransactionModal: React.FC<EditTransactionModalProps> = ({
  isOpen,
  transaction,
  onClose,
  onSuccess,
}) => {
  const [type, setType] = useState<"EXPENSE" | "INCOME">("EXPENSE");
  const [amount, setAmount] = useState<string>("");
  const [paymentMode, setPaymentMode] = useState<"UPI" | "CASH" | "CARD" | "NET_BANKING">("UPI");
  const [categoryId, setCategoryId] = useState<string>("");
  const [categories, setCategories] = useState<Category[]>([]);
  const [notes, setNotes] = useState<string>("");
  const [date, setDate] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    if (isOpen && transaction) {
      setType(transaction.type);
      setAmount(transaction.amount.toString());
      setPaymentMode(transaction.paymentMode);
      setNotes(transaction.notes || "");
      setDate(
        transaction.date
          ? new Date(transaction.date).toISOString().split("T")[0]
          : new Date().toISOString().split("T")[0]
      );

      const catId =
        typeof transaction.category === "object"
          ? transaction.category._id
          : transaction.category;
      setCategoryId(catId || "");

      fetchCategories();
    }
  }, [isOpen, transaction]);

  const fetchCategories = async () => {
    try {
      const res = await fetch("/api/categories");
      const json = await res.json();
      if (json.success && json.data.length > 0) {
        // Sort categories alphabetically
        const sorted = [...json.data].sort((a: Category, b: Category) =>
          a.name.localeCompare(b.name)
        );
        setCategories(sorted);
      }
    } catch (e) {
      console.error("Failed to fetch categories", e);
    }
  };

  if (!isOpen || !transaction) return null;

  // Categories filtered according to type:
  // If Income -> Salary only
  // If Expense -> All categories sorted alphabetically (excluding Salary)
  const salaryCategory = categories.find((c) => c.name.toLowerCase() === "salary");
  const displayCategories =
    type === "INCOME"
      ? salaryCategory
        ? [salaryCategory]
        : categories.filter((c) => c.name.toLowerCase().includes("salary"))
      : categories.filter((c) => c.name.toLowerCase() !== "salary");

  const handleTypeChange = (newType: "EXPENSE" | "INCOME") => {
    setType(newType);
    if (newType === "INCOME") {
      if (salaryCategory) {
        setCategoryId(salaryCategory._id);
      }
    } else {
      if (categoryId === salaryCategory?._id) {
        const firstExpense = categories.find((c) => c.name.toLowerCase() !== "salary");
        if (firstExpense) setCategoryId(firstExpense._id);
      }
    }
  };

  const handleSave = async (e: React.FormEvent) => {
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
      const res = await fetch(`/api/transactions/${transaction._id}`, {
        method: "PUT",
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
        setError(data.message || "Failed to update transaction");
        return;
      }

      clearCache();
      window.dispatchEvent(new CustomEvent("finance_data_updated"));
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to permanently delete this transaction?")) return;
    try {
      setDeleting(true);
      const res = await fetch(`/api/transactions/${transaction._id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        clearCache();
        window.dispatchEvent(new CustomEvent("finance_data_updated"));
        onSuccess();
        onClose();
      } else {
        setError(data.message || "Failed to delete");
      }
    } catch (err: any) {
      setError(err.message || "Failed to delete");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-2xl bg-zinc-950 border border-zinc-800 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-zinc-850 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-base font-bold text-zinc-100">Edit Transaction</span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/80 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSave} className="p-4 sm:p-6 overflow-y-auto space-y-5">
          {error && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-medium">
              {error}
            </div>
          )}

          {/* Type Toggle: Expense vs Income */}
          <div className="grid grid-cols-2 gap-2 p-1 bg-zinc-900 rounded-xl border border-zinc-800">
            <button
              type="button"
              onClick={() => handleTypeChange("EXPENSE")}
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
              onClick={() => handleTypeChange("INCOME")}
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
              Amount
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
                className={`w-full pl-10 pr-4 py-3 bg-zinc-900/80 border rounded-xl text-2xl font-extrabold focus:outline-none focus:ring-2 transition-all ${
                  type === "EXPENSE"
                    ? "border-rose-500/30 focus:border-rose-500 focus:ring-rose-500/20 text-rose-400"
                    : "border-emerald-500/30 focus:border-emerald-500 focus:ring-emerald-500/20 text-emerald-400"
                }`}
              />
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
                    className={`p-2.5 rounded-xl border flex flex-col items-center gap-1.5 transition-all text-center ${
                      isSelected
                        ? "border-emerald-500/80 bg-emerald-500/10 shadow-[0_0_12px_rgba(16,185,129,0.2)]"
                        : "border-zinc-800 bg-zinc-900/40 hover:bg-zinc-900 hover:border-zinc-700"
                    }`}
                  >
                    <CategoryIcon name={cat.icon} className="w-4 h-4 text-zinc-300" />
                    <span className="text-[11px] font-medium text-zinc-200 truncate w-full">
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
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">Date</label>
              <div className="relative">
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-3 py-2.5 bg-zinc-900/80 border border-zinc-800 rounded-xl text-xs text-zinc-200 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">
                Note / Description
              </label>
              <input
                type="text"
                placeholder="e.g. Dinner, Snacks, Bill"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3 py-2.5 bg-zinc-900/80 border border-zinc-800 rounded-xl text-xs text-zinc-200 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={handleDelete}
              disabled={deleting || loading}
              className="py-3 px-4 rounded-xl border border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 font-semibold text-xs flex items-center gap-1.5 transition-all active:scale-95"
            >
              <Trash2 className="w-4 h-4" />
              <span>{deleting ? "Deleting..." : "Delete"}</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="py-3 px-4 rounded-xl border border-zinc-800 bg-zinc-900/60 text-zinc-400 hover:text-zinc-200 text-xs font-medium transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || deleting}
                className="py-3 px-5 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-400 hover:from-emerald-400 hover:to-emerald-300 text-zinc-950 font-bold text-xs shadow-[0_0_15px_rgba(16,185,129,0.3)] transition-all flex items-center gap-1.5 active:scale-95"
              >
                <Check className="w-4 h-4 stroke-[3]" />
                <span>{loading ? "Saving..." : "Save Changes"}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

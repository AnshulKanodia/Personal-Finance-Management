"use client";

import React, { useState, useEffect } from "react";
import { X, Check, Calendar, CreditCard, Bell, Sparkles } from "lucide-react";
import { CategoryIcon } from "./CategoryIcon";

interface Category {
  _id: string;
  name: string;
  color: string;
  icon: string;
}

interface AddSubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  subscriptionToEdit?: any;
}

export const AddSubscriptionModal: React.FC<AddSubscriptionModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  subscriptionToEdit,
}) => {
  const [name, setName] = useState<string>("");
  const [amount, setAmount] = useState<string>("");
  const [billingCycle, setBillingCycle] = useState<"MONTHLY" | "QUARTERLY" | "YEARLY">("MONTHLY");
  const [dueDay, setDueDay] = useState<number>(1);
  const [categoryId, setCategoryId] = useState<string>("");
  const [categories, setCategories] = useState<Category[]>([]);
  const [paymentMode, setPaymentMode] = useState<"UPI" | "CARD" | "NET_BANKING" | "CASH">("UPI");
  const [reminderDays, setReminderDays] = useState<number>(3);
  const [notes, setNotes] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    if (isOpen) {
      fetchCategories();
      if (subscriptionToEdit) {
        setName(subscriptionToEdit.name || "");
        setAmount(subscriptionToEdit.amount?.toString() || "");
        setBillingCycle(subscriptionToEdit.billingCycle || "MONTHLY");
        setDueDay(subscriptionToEdit.dueDay || 1);
        setCategoryId(subscriptionToEdit.category?._id || subscriptionToEdit.category || "");
        setPaymentMode(subscriptionToEdit.paymentMode || "UPI");
        setReminderDays(subscriptionToEdit.reminderDaysBefore ?? 3);
        setNotes(subscriptionToEdit.notes || "");
      } else {
        setName("");
        setAmount("");
        setBillingCycle("MONTHLY");
        setDueDay(new Date().getDate());
        setPaymentMode("UPI");
        setReminderDays(3);
        setNotes("");
      }
      setError("");
    }
  }, [isOpen, subscriptionToEdit]);

  const fetchCategories = async () => {
    try {
      const res = await fetch("/api/categories");
      const json = await res.json();
      if (json.success && json.data.length > 0) {
        setCategories(json.data);
        if (!subscriptionToEdit && !categoryId) {
          const defaultCat =
            json.data.find((c: Category) => c.name.toLowerCase().includes("subscript")) ||
            json.data.find((c: Category) => c.name.toLowerCase().includes("entertain")) ||
            json.data.find((c: Category) => c.name.toLowerCase().includes("bill")) ||
            json.data[0];
          if (defaultCat) setCategoryId(defaultCat._id);
        }
      }
    } catch (e) {
      console.error("Failed to load categories", e);
    }
  };

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!name.trim()) {
      setError("Please provide a subscription name (e.g. Netflix, Gym, Rent)");
      return;
    }

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setError("Please enter a valid amount greater than ₹0");
      return;
    }

    if (dueDay < 1 || dueDay > 31) {
      setError("Due day must be between 1 and 31");
      return;
    }

    try {
      setLoading(true);
      const url = subscriptionToEdit
        ? `/api/subscriptions/${subscriptionToEdit._id}`
        : "/api/subscriptions";
      const method = subscriptionToEdit ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          amount: numAmount,
          billingCycle,
          dueDay,
          category: categoryId || undefined,
          paymentMode,
          reminderDaysBefore: reminderDays,
          notes: notes.trim(),
        }),
      });

      const json = await res.json();
      if (!json.success) {
        setError(json.message || "Failed to save subscription");
        return;
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to process request");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-md rounded-2xl bg-zinc-950 border border-zinc-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-zinc-850 flex items-center justify-between shrink-0 bg-zinc-950/80 backdrop-blur-sm">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-indigo-400" />
            <span className="text-sm sm:text-base font-bold text-zinc-100">
              {subscriptionToEdit ? "Edit Subscription" : "Add Recurring Commitment"}
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/80 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-4 overflow-y-auto custom-scrollbar text-xs">
          {error && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-medium animate-shake">
              {error}
            </div>
          )}

          {/* Name & Amount */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">
                Commitment / Service Name
              </label>
              <input
                type="text"
                placeholder="e.g. Netflix, Wifi, Rent..."
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-zinc-100 focus:outline-none focus:border-indigo-500"
                autoFocus
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">
                Amount (₹)
              </label>
              <input
                type="number"
                step="any"
                inputMode="decimal"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-zinc-100 font-mono font-bold focus:outline-none focus:border-indigo-500"
                required
              />
            </div>
          </div>

          {/* Billing Cycle & Due Day */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">
                Billing Cycle
              </label>
              <select
                value={billingCycle}
                onChange={(e) => setBillingCycle(e.target.value as any)}
                className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-zinc-200 focus:outline-none focus:border-indigo-500"
              >
                <option value="MONTHLY">Monthly</option>
                <option value="QUARTERLY">Quarterly (Every 3 mo)</option>
                <option value="YEARLY">Yearly (Annual)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">
                Due Day of Month (1-31)
              </label>
              <input
                type="number"
                min={1}
                max={31}
                value={dueDay}
                onChange={(e) => setDueDay(parseInt(e.target.value, 10) || 1)}
                className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-zinc-100 font-mono focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Category Selector */}
          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1.5">
              Category
            </label>
            <div className="grid grid-cols-3 gap-2 max-h-32 overflow-y-auto pr-1">
              {categories.map((cat) => {
                const isSelected = categoryId === cat._id;
                return (
                  <button
                    type="button"
                    key={cat._id}
                    onClick={() => setCategoryId(cat._id)}
                    className={`flex items-center gap-2 p-2 rounded-xl border text-left transition-all ${
                      isSelected
                        ? "border-indigo-500/50 bg-indigo-500/10 text-zinc-100 shadow-[0_0_12px_rgba(99,102,241,0.2)]"
                        : "border-zinc-800 bg-zinc-900/60 text-zinc-400 hover:border-zinc-700"
                    }`}
                  >
                    <div
                      className="p-1 rounded-lg shrink-0"
                      style={{
                        backgroundColor: `${cat.color}20`,
                        color: cat.color,
                      }}
                    >
                      <CategoryIcon name={cat.icon} className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-[11px] font-medium truncate">{cat.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Payment Mode Selector */}
          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1">
              Payment Method
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: "UPI", label: "UPI" },
                { id: "CARD", label: "Card / NetBanking" },
                { id: "CASH", label: "Cash" },
              ].map((m) => (
                <button
                  type="button"
                  key={m.id}
                  onClick={() => setPaymentMode(m.id as any)}
                  className={`py-2 px-2 rounded-xl text-xs font-semibold border transition-all text-center ${
                    paymentMode === m.id
                      ? "text-indigo-400 border-indigo-500/40 bg-indigo-500/10 shadow-[0_0_10px_rgba(99,102,241,0.2)]"
                      : "border-zinc-800 bg-zinc-900/60 text-zinc-400 hover:border-zinc-700"
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          {/* Reminder Days */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-medium text-zinc-300 flex items-center gap-1">
                <Bell className="w-3.5 h-3.5 text-amber-400" />
                <span>Alert Window</span>
              </label>
              <span className="text-[11px] font-mono text-amber-400 font-semibold">
                {reminderDays} days before due date
              </span>
            </div>
            <input
              type="range"
              min={1}
              max={7}
              value={reminderDays}
              onChange={(e) => setReminderDays(parseInt(e.target.value, 10))}
              className="w-full accent-indigo-500 bg-zinc-800 cursor-pointer"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1">
              Notes (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Shared with roommates, annual plan..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-zinc-100 focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Submit Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl font-bold text-xs sm:text-sm bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-400 hover:to-indigo-500 text-white transition-all flex items-center justify-center gap-2 active:scale-98 shadow-[0_0_20px_rgba(99,102,241,0.3)] disabled:opacity-50"
            >
              {loading ? (
                <span>Saving...</span>
              ) : (
                <>
                  <Check className="w-4 h-4 stroke-[3]" />
                  <span>
                    {subscriptionToEdit ? "Save Changes" : "Create Subscription"}
                  </span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

"use client";

import React, { useState, useEffect, useCallback, useRef, memo } from "react";
import { createPortal } from "react-dom";
import { X, Check, Calendar, Bell } from "lucide-react";
import { CategoryIcon } from "./CategoryIcon";
import { getCached, setCached } from "@/lib/clientCache";

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

const CategorySelector = memo(({
  categories,
  selectedId,
  onSelect,
}: {
  categories: Category[];
  selectedId: string;
  onSelect: (id: string) => void;
}) => {
  return (
    <div>
      <label className="block text-xs font-medium text-zinc-300 mb-1.5">
        Category
      </label>
      <div className="grid grid-cols-3 gap-2 max-h-32 overflow-y-auto pr-1">
        {categories.map((cat) => {
          const isSelected = selectedId === cat._id;
          return (
            <button
              type="button"
              key={cat._id}
              onClick={() => onSelect(cat._id)}
              className={`flex items-center gap-2 p-2 rounded-xl border text-left transition-colors ${
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
  );
});
CategorySelector.displayName = "CategorySelector";

const PaymentModeSelector = memo(({
  mode,
  onChange,
}: {
  mode: string;
  onChange: (m: "UPI" | "CARD" | "NET_BANKING" | "CASH") => void;
}) => {
  return (
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
            onClick={() => onChange(m.id as any)}
            className={`py-2 px-2 rounded-xl text-xs font-semibold border transition-colors text-center ${
              mode === m.id
                ? "text-indigo-400 border-indigo-500/40 bg-indigo-500/10 shadow-[0_0_10px_rgba(99,102,241,0.2)]"
                : "border-zinc-800 bg-zinc-900/60 text-zinc-400 hover:border-zinc-700"
            }`}
          >
            {m.label}
          </button>
        ))}
      </div>
    </div>
  );
});
PaymentModeSelector.displayName = "PaymentModeSelector";

export const AddSubscriptionModal: React.FC<AddSubscriptionModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  subscriptionToEdit,
}) => {
  const [categoryId, setCategoryId] = useState<string>("");
  const [categories, setCategories] = useState<Category[]>(() => getCached<Category[]>("all_categories") || []);
  const [paymentMode, setPaymentMode] = useState<"UPI" | "CARD" | "NET_BANKING" | "CASH">("UPI");
  const [reminderDays, setReminderDays] = useState<number>(3);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [mounted, setMounted] = useState<boolean>(false);
  const nameInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSelectCategory = useCallback((id: string) => {
    setCategoryId(id);
  }, []);

  const handlePaymentModeChange = useCallback((m: "UPI" | "CARD" | "NET_BANKING" | "CASH") => {
    setPaymentMode(m);
  }, []);

  const fetchCategories = useCallback(async () => {
    const cached = getCached<Category[]>("all_categories");
    if (cached && cached.length > 0) {
      setCategories(cached);
      return;
    }
    try {
      const res = await fetch("/api/categories");
      const json = await res.json();
      if (json.success && Array.isArray(json.data) && json.data.length > 0) {
        setCategories(json.data);
        setCached("all_categories", json.data);
      }
    } catch (e) {
      console.error("Failed to load categories", e);
    }
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (isOpen) {
      fetchCategories();
      if (subscriptionToEdit) {
        setCategoryId(subscriptionToEdit.category?._id || subscriptionToEdit.category || "");
        setPaymentMode(subscriptionToEdit.paymentMode || "UPI");
        setReminderDays(subscriptionToEdit.reminderDaysBefore ?? 3);
      } else {
        setPaymentMode("UPI");
        setReminderDays(3);
        const currentCats = getCached<Category[]>("all_categories") || categories;
        if (currentCats.length > 0) {
          const defaultCat =
            currentCats.find((c) => c.name.toLowerCase().includes("subscript")) ||
            currentCats.find((c) => c.name.toLowerCase().includes("entertain")) ||
            currentCats.find((c) => c.name.toLowerCase().includes("bill")) ||
            currentCats[0];
          if (defaultCat) setCategoryId(defaultCat._id);
        }
      }
      setError("");

      const timer = setTimeout(() => {
        nameInputRef.current?.focus();
      }, 60);
      return () => clearTimeout(timer);
    }
  }, [isOpen, subscriptionToEdit, fetchCategories]);

  if (!isOpen || !mounted) return null;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");

    const form = e.currentTarget;
    const formData = new FormData(form);

    const nameVal = formData.get("name")?.toString().trim() || "";
    const amountVal = parseFloat(formData.get("amount")?.toString() || "");
    const billingCycleVal = (formData.get("billingCycle")?.toString() || "MONTHLY") as "MONTHLY" | "QUARTERLY" | "YEARLY";
    const dueDayVal = parseInt(formData.get("dueDay")?.toString() || "1", 10);
    const notesVal = formData.get("notes")?.toString().trim() || "";

    if (!nameVal) {
      setError("Please provide a subscription name (e.g. Netflix, Gym, Rent)");
      return;
    }

    if (isNaN(amountVal) || amountVal <= 0) {
      setError("Please enter a valid amount greater than ₹0");
      return;
    }

    if (dueDayVal < 1 || dueDayVal > 31) {
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
          name: nameVal,
          amount: amountVal,
          billingCycle: billingCycleVal,
          dueDay: dueDayVal,
          category: categoryId || undefined,
          paymentMode,
          reminderDaysBefore: reminderDays,
          notes: notesVal,
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

  const defaultDueDay = subscriptionToEdit?.dueDay || new Date().getDate();

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-black/85 transition-opacity"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md rounded-2xl bg-zinc-950 border border-zinc-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-150 transform-gpu isolate"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-zinc-850 flex items-center justify-between shrink-0 bg-zinc-950">
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
        <form
          key={subscriptionToEdit ? subscriptionToEdit._id : "new"}
          onSubmit={handleSubmit}
          className="p-4 sm:p-5 space-y-4 overflow-y-auto text-xs"
        >
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
                ref={nameInputRef}
                name="name"
                type="text"
                placeholder="e.g. Netflix, Wifi, Rent..."
                defaultValue={subscriptionToEdit?.name || ""}
                className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-zinc-100 focus:outline-none focus:border-indigo-500 transition-colors"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">
                Amount (₹)
              </label>
              <input
                name="amount"
                type="number"
                step="any"
                inputMode="decimal"
                placeholder="0.00"
                defaultValue={subscriptionToEdit?.amount?.toString() || ""}
                className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-zinc-100 font-mono font-bold focus:outline-none focus:border-indigo-500 transition-colors"
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
                name="billingCycle"
                defaultValue={subscriptionToEdit?.billingCycle || "MONTHLY"}
                className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-zinc-200 focus:outline-none focus:border-indigo-500 transition-colors"
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
                name="dueDay"
                type="number"
                min={1}
                max={31}
                defaultValue={defaultDueDay}
                className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-zinc-100 font-mono focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>
          </div>

          {/* Category Selector (Memoized) */}
          <CategorySelector
            categories={categories}
            selectedId={categoryId}
            onSelect={handleSelectCategory}
          />

          {/* Payment Mode Selector (Memoized) */}
          <PaymentModeSelector
            mode={paymentMode}
            onChange={handlePaymentModeChange}
          />

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
              name="notes"
              type="text"
              placeholder="e.g. Shared with roommates, annual plan..."
              defaultValue={subscriptionToEdit?.notes || ""}
              className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-zinc-100 focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>

          {/* Buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-zinc-850">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-3.5 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-850 text-zinc-300 text-xs font-semibold transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-[0_0_12px_rgba(99,102,241,0.3)] transition-all active:scale-95 disabled:opacity-50 flex items-center gap-1.5"
            >
              {loading ? (
                <span>Saving...</span>
              ) : (
                <>
                  <Check className="w-4 h-4 stroke-[2.5]" />
                  <span>{subscriptionToEdit ? "Update Bill" : "Save Commitment"}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};

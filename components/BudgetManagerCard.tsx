"use client";

import React, { useState, useEffect } from "react";
import {
  ShieldCheck,
  ShieldAlert,
  Plus,
  Edit2,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  X,
  SlidersHorizontal,
  ChevronRight,
  TrendingDown,
  Info,
} from "lucide-react";
import { formatINR } from "@/lib/utils";
import { PrivacyMask } from "@/components/PrivacyMask";
import { CategoryIcon } from "@/components/CategoryIcon";
import { useBudgets, BudgetWithMetrics } from "@/hooks/useBudgets";
import Link from "next/link";

interface CategoryOption {
  _id: string;
  name: string;
  color: string;
  icon: string;
}

interface BudgetManagerCardProps {
  currentMonth: string;
}

export const BudgetManagerCard: React.FC<BudgetManagerCardProps> = ({ currentMonth }) => {
  const { budgets, summary, loading, saveBudget, deleteBudget, refresh } = useBudgets(currentMonth);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState<BudgetWithMetrics | null>(null);
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [limitAmount, setLimitAmount] = useState<string>("");
  const [alertThreshold, setAlertThreshold] = useState<number>(80);
  const [notes, setNotes] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Fetch categories for modal dropdown
  useEffect(() => {
    async function loadCategories() {
      try {
        const res = await fetch("/api/categories");
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          setCategories(json.data);
          if (json.data.length > 0 && !selectedCategory) {
            setSelectedCategory(json.data[0]._id);
          }
        }
      } catch (err) {
        console.error("Failed to load categories for budget modal", err);
      }
    }
    loadCategories();
  }, []);

  const openAddModal = (catId?: string) => {
    setEditingBudget(null);
    setSelectedCategory(catId || (categories.length > 0 ? categories[0]._id : ""));
    setLimitAmount("");
    setAlertThreshold(80);
    setNotes("");
    setFormError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (budget: BudgetWithMetrics) => {
    setEditingBudget(budget);
    setSelectedCategory(budget.category?._id || "");
    setLimitAmount(budget.monthlyLimit.toString());
    setAlertThreshold(budget.alertThreshold || 80);
    setNotes(budget.notes || "");
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const parsedLimit = parseFloat(limitAmount);
    if (isNaN(parsedLimit) || parsedLimit <= 0) {
      setFormError("Please enter a valid monthly limit greater than ₹0");
      return;
    }

    if (!selectedCategory) {
      setFormError("Please select a category");
      return;
    }

    try {
      setSubmitting(true);
      const res = await saveBudget({
        category: selectedCategory,
        monthlyLimit: parsedLimit,
        month: currentMonth,
        alertThreshold,
        notes: notes.trim(),
        isActive: true,
      });

      if (res.success) {
        setIsModalOpen(false);
      } else {
        setFormError(res.message || "Failed to save budget");
      }
    } catch (err: any) {
      setFormError(err.message || "An unexpected error occurred");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (budgetId: string) => {
    if (!confirm("Are you sure you want to remove this category budget?")) return;
    try {
      setSubmitting(true);
      const res = await deleteBudget(budgetId);
      if (res.success) {
        setIsModalOpen(false);
      } else {
        alert(res.message || "Failed to remove budget");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const hasBreached = summary.overBudgetCount > 0;
  const hasWarning = summary.warningCount > 0;

  return (
    <div className="rounded-2xl glass-panel p-4 sm:p-5 border border-zinc-800 relative overflow-hidden transition-all duration-300">
      {/* Top Hairline Glow Accent */}
      <div
        className={`absolute top-0 inset-x-0 h-[1.5px] bg-gradient-to-r ${
          hasBreached
            ? "from-rose-500/20 via-rose-500 to-rose-500/20"
            : hasWarning
            ? "from-amber-500/20 via-amber-500 to-amber-500/20"
            : "from-emerald-500/20 via-emerald-500 to-emerald-500/20"
        }`}
      />

      {/* Header Section */}
      <div className="flex flex-wrap sm:flex-nowrap items-start sm:items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2.5 min-w-0">
          <div
            className={`p-2 rounded-xl border shadow-inner flex-shrink-0 ${
              hasBreached
                ? "bg-rose-500/10 border-rose-500/30 text-rose-400"
                : hasWarning
                ? "bg-amber-500/10 border-amber-500/30 text-amber-400"
                : "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
            }`}
          >
            {hasBreached ? (
              <ShieldAlert className="w-4 h-4 stroke-[2.2] animate-pulse" />
            ) : (
              <ShieldCheck className="w-4 h-4 stroke-[2.2]" />
            )}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="text-xs sm:text-sm font-bold text-zinc-100 tracking-tight">
                Vault Guard Budgets
              </h2>
              {summary.activeBudgetsCount > 0 && (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-zinc-850 text-zinc-300 border border-zinc-750">
                  {summary.activeBudgetsCount} active
                </span>
              )}
            </div>
            <p className="text-[11px] text-zinc-400">
              Real-time spend pacing & monthly guardrails
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => openAddModal()}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 font-semibold text-xs transition-all active:scale-95"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Set Budget</span>
          </button>
        </div>
      </div>

      {/* High-Level Overview Strip */}
      {summary.activeBudgetsCount > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4 p-3 rounded-xl bg-zinc-950/70 border border-zinc-850">
          <div>
            <div className="text-[10px] uppercase font-mono text-zinc-500">Allocated</div>
            <div className="text-xs sm:text-sm font-bold font-mono text-zinc-200">
              <PrivacyMask>{formatINR(summary.totalBudget)}</PrivacyMask>
            </div>
          </div>
          <div>
            <div className="text-[10px] uppercase font-mono text-zinc-500">Burned</div>
            <div className="text-xs sm:text-sm font-bold font-mono text-zinc-300">
              <PrivacyMask>{formatINR(summary.totalSpent)}</PrivacyMask>
            </div>
          </div>
          <div>
            <div className="text-[10px] uppercase font-mono text-zinc-500">Safe Headroom</div>
            <div
              className={`text-xs sm:text-sm font-bold font-mono ${
                summary.totalRemaining >= 0 ? "text-emerald-400" : "text-rose-400"
              }`}
            >
              <PrivacyMask>
                {summary.totalRemaining >= 0
                  ? formatINR(summary.totalRemaining)
                  : `-${formatINR(Math.abs(summary.totalRemaining))}`}
              </PrivacyMask>
            </div>
          </div>
          <div>
            <div className="text-[10px] uppercase font-mono text-zinc-500">Protection Status</div>
            <div className="text-xs font-semibold flex items-center gap-1 mt-0.5">
              {hasBreached ? (
                <span className="text-rose-400 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" />
                  {summary.overBudgetCount} breached
                </span>
              ) : hasWarning ? (
                <span className="text-amber-400 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" />
                  {summary.warningCount} warning
                </span>
              ) : (
                <span className="text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  All guarded
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Category Progress Bars */}
      {budgets.length > 0 ? (
        <div className="space-y-3.5">
          {budgets.map((b) => {
            const isBreach = b.status === "OVER_BUDGET";
            const isWarn = b.status === "WARNING";
            const cat = b.category || {
              _id: "unknown",
              name: "General",
              color: "#71717a",
              icon: "Tag",
            };

            const barPercent = Math.min(100, Math.max(0, b.percentUsed));

            return (
              <div
                key={b._id}
                className="p-3 rounded-xl bg-zinc-900/40 hover:bg-zinc-900/70 border border-zinc-800/80 transition-all duration-200 group"
              >
                {/* Category Header Row */}
                <div className="flex items-center justify-between gap-3 mb-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      className="p-2 rounded-lg border flex items-center justify-center flex-shrink-0"
                      style={{
                        backgroundColor: `${cat.color}15`,
                        borderColor: `${cat.color}35`,
                        color: cat.color,
                      }}
                    >
                      <CategoryIcon name={cat.icon} className="w-3.5 h-3.5" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs sm:text-sm font-bold text-zinc-100 truncate">
                          {cat.name}
                        </span>
                        <span className="text-[10px] text-zinc-500 font-mono">
                          {b.transactionCount} {b.transactionCount === 1 ? "txn" : "txns"}
                        </span>
                      </div>
                      {b.notes && (
                        <p className="text-[10px] text-zinc-500 truncate">{b.notes}</p>
                      )}
                    </div>
                  </div>

                  {/* Amounts & Edit button */}
                  <div className="flex items-center gap-2.5 flex-shrink-0">
                    <div className="text-right">
                      <div className="text-xs sm:text-sm font-bold font-mono text-zinc-200">
                        <PrivacyMask>{formatINR(b.spent)}</PrivacyMask>
                        <span className="text-[10px] text-zinc-500 font-normal">
                          {" "}
                          / {formatINR(b.monthlyLimit)}
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => openEditModal(b)}
                      className="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800 transition-colors opacity-70 group-hover:opacity-100"
                      title="Edit budget limit"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Visual Progress Bar */}
                <div className="space-y-1.5">
                  <div className="h-2 w-full bg-zinc-950 rounded-full overflow-hidden p-0.5 border border-zinc-800/80">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ease-out ${
                        isBreach
                          ? "bg-gradient-to-r from-rose-500 via-rose-600 to-red-500 shadow-[0_0_12px_rgba(244,63,94,0.4)]"
                          : isWarn
                          ? "bg-gradient-to-r from-amber-500 to-orange-400 shadow-[0_0_10px_rgba(245,158,11,0.3)]"
                          : "bg-gradient-to-r from-emerald-500 to-teal-400 shadow-[0_0_8px_rgba(16,185,129,0.25)]"
                      }`}
                      style={{ width: `${barPercent}%` }}
                    />
                  </div>

                  {/* Progress Status Footer */}
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="font-mono text-zinc-400">
                      {b.percentUsed}% burned
                    </span>

                    {isBreach ? (
                      <span className="font-semibold text-rose-400 flex items-center gap-1 font-mono">
                        <AlertTriangle className="w-3 h-3 stroke-[2.5]" />
                        Exceeded by <PrivacyMask>{formatINR(b.overspendAmount)}</PrivacyMask>
                      </span>
                    ) : isWarn ? (
                      <span className="font-semibold text-amber-400 flex items-center gap-1 font-mono">
                        <AlertTriangle className="w-3 h-3 stroke-[2.5]" />
                        <PrivacyMask>{formatINR(b.remaining)}</PrivacyMask> left before cap
                      </span>
                    ) : (
                      <span className="text-emerald-400/90 font-mono">
                        <PrivacyMask>{formatINR(b.remaining)}</PrivacyMask> safe headroom
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Empty State */
        <div className="text-center py-7 px-4 rounded-xl bg-zinc-950/40 border border-zinc-850 border-dashed">
          <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto mb-2.5">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <h3 className="text-xs sm:text-sm font-bold text-zinc-200">
            No Budgets Configured for {currentMonth}
          </h3>
          <p className="text-[11px] text-zinc-400 max-w-sm mx-auto mt-1 mb-3.5">
            Set monthly guardrails for dining, rent, or shopping to prevent overspending and keep burn rate under control.
          </p>
          <button
            onClick={() => openAddModal()}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-xs shadow-[0_0_15px_rgba(16,185,129,0.3)] transition-all active:scale-95"
          >
            <Plus className="w-3.5 h-3.5 stroke-[3]" />
            <span>Set Up First Category Budget</span>
          </button>
        </div>
      )}

      {/* Set / Edit Budget Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-md rounded-3xl bg-zinc-950 border border-zinc-800 shadow-2xl overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 sm:p-5 border-b border-zinc-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                  <SlidersHorizontal className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-zinc-100">
                    {editingBudget ? "Edit Category Budget" : "Set Category Budget"}
                  </h3>
                  <p className="text-[11px] text-zinc-400">
                    Monthly spending cap for {currentMonth}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-xl text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSave} className="p-4 sm:p-5 space-y-4">
              {formError && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Category Dropdown */}
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                  Category
                </label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  disabled={editingBudget !== null}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-zinc-200 focus:outline-none focus:border-emerald-500 transition-colors disabled:opacity-60"
                >
                  {categories.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Monthly Limit Input with Preset Pills */}
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                  Monthly Limit (₹)
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500 font-mono font-bold text-sm">
                    ₹
                  </span>
                  <input
                    type="number"
                    step="any"
                    min="1"
                    required
                    value={limitAmount}
                    onChange={(e) => setLimitAmount(e.target.value)}
                    placeholder="e.g. 5000"
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-8 pr-3.5 py-2.5 text-xs sm:text-sm text-zinc-200 font-mono focus:outline-none focus:border-emerald-500 transition-colors"
                  />
                </div>

                {/* Preset Limit Buttons */}
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {[1000, 2500, 5000, 10000, 20000].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setLimitAmount(preset.toString())}
                      className="px-2 py-1 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-zinc-200 text-[10px] font-mono transition-colors"
                    >
                      ₹{preset.toLocaleString("en-IN")}
                    </button>
                  ))}
                </div>
              </div>

              {/* Alert Threshold Slider */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-zinc-300">
                    Warning Alert Trigger
                  </label>
                  <span className="text-xs font-mono font-bold text-amber-400">
                    {alertThreshold}% of limit
                  </span>
                </div>
                <input
                  type="range"
                  min="50"
                  max="95"
                  step="5"
                  value={alertThreshold}
                  onChange={(e) => setAlertThreshold(parseInt(e.target.value, 10))}
                  className="w-full accent-emerald-500 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-zinc-500 font-mono mt-0.5">
                  <span>50% (Strict)</span>
                  <span>80% (Recommended)</span>
                  <span>95% (Relaxed)</span>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                  Target / Notes (Optional)
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Keep groceries within cap before month end"
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-zinc-200 focus:outline-none focus:border-emerald-500 transition-colors"
                />
              </div>

              {/* Modal Buttons */}
              <div className="flex items-center justify-between gap-3 pt-3 border-t border-zinc-850">
                {editingBudget ? (
                  <button
                    type="button"
                    disabled={submitting}
                    onClick={() => handleDelete(editingBudget._id)}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 text-xs font-semibold transition-colors disabled:opacity-50"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete</span>
                  </button>
                ) : (
                  <div />
                )}

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-3.5 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-xs font-semibold transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 text-xs font-bold shadow-[0_0_15px_rgba(16,185,129,0.3)] transition-all active:scale-95 disabled:opacity-50"
                  >
                    {submitting ? "Saving..." : editingBudget ? "Update Budget" : "Save Budget"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

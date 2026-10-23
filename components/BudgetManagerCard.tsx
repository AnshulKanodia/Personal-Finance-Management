"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  ShieldCheck,
  ShieldAlert,
  Plus,
  Edit2,
  Trash2,
  AlertTriangle,
  AlertOctagon,
  CheckCircle2,
  X,
  SlidersHorizontal,
  ChevronRight,
  TrendingDown,
  Info,
  Flame,
  Zap,
  Calendar,
  RotateCcw,
  Wallet,
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
  const {
    budgets,
    summary,
    loading,
    saveBudget,
    rolloverBudgets,
    deleteBudget,
    refresh,
  } = useBudgets(currentMonth);

  // Modal State
  const [mounted, setMounted] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState<BudgetWithMetrics | null>(null);
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [limitAmount, setLimitAmount] = useState<string>("");
  const [alertThreshold, setAlertThreshold] = useState<number>(80);
  const [rolloverUnspent, setRolloverUnspent] = useState<boolean>(false);
  const [notes, setNotes] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Escape key listener for modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsModalOpen(false);
    };
    if (isModalOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isModalOpen]);

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
    setRolloverUnspent(false);
    setNotes("");
    setFormError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (budget: BudgetWithMetrics) => {
    setEditingBudget(budget);
    setSelectedCategory(budget.category?._id || "");
    setLimitAmount(budget.monthlyLimit.toString());
    setAlertThreshold(budget.alertThreshold || 80);
    setRolloverUnspent(Boolean(budget.rolloverUnspent));
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
        rolloverUnspent,
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

  const handleRolloverCopy = async () => {
    try {
      setSubmitting(true);
      const res = await rolloverBudgets();
      if (!res.success) {
        alert(res.message || "Failed to copy budgets from previous month");
      }
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

  const breachedList = budgets.filter((b) => b.status === "OVER_BUDGET");
  const overspendingList = budgets.filter((b) => b.burnPace === "OVERSPENDING");
  const hasBreached = summary.overBudgetCount > 0 || breachedList.length > 0;
  const hasWarning = summary.warningCount > 0;
  const hasOverspending = (summary.overspendingCount ?? 0) > 0 || overspendingList.length > 0;
  const totalOverspendAmount = breachedList.reduce((acc, b) => acc + (b.overspendAmount || 0), 0);

  const displayTotalBudget = summary.totalEffectiveBudget || summary.totalBudget;

  return (
    <div className="rounded-2xl glass-panel p-4 sm:p-5 border border-zinc-800 relative overflow-hidden transition-colors duration-200">
      {/* Top Hairline Glow Accent */}
      <div
        className={`absolute top-0 inset-x-0 h-[1.5px] bg-gradient-to-r ${
          hasBreached
            ? "from-rose-500/20 via-rose-500 to-rose-500/20"
            : hasOverspending || hasWarning
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
                : hasOverspending || hasWarning
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
          {summary.activeBudgetsCount === 0 && (summary.previousMonthBudgetsCount ?? 0) > 0 && (
            <button
              onClick={handleRolloverCopy}
              disabled={submitting}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-teal-500/15 hover:bg-teal-500/25 border border-teal-500/30 text-teal-300 font-semibold text-xs transition-all active:scale-95 disabled:opacity-50"
            >
              <RotateCcw className="w-3.5 h-3.5 stroke-[2.2]" />
              <span className="hidden sm:inline">Copy from {summary.previousMonth}</span>
              <span className="sm:hidden">Copy Last Month</span>
            </button>
          )}

          <button
            onClick={() => openAddModal()}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 font-semibold text-xs transition-all active:scale-95"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Set Budget</span>
          </button>
        </div>
      </div>

      {/* Real-Time Smart Alert Banner */}
      {summary.activeBudgetsCount > 0 && (hasBreached || hasOverspending) && (
        <div
          className={`mb-4 p-3.5 rounded-2xl border flex items-start justify-between gap-3 animate-in fade-in slide-in-from-top-1 duration-300 ${
            hasBreached
              ? "bg-rose-500/10 border-rose-500/30 text-rose-300 shadow-[0_0_15px_rgba(244,63,94,0.12)]"
              : "bg-amber-500/10 border-amber-500/30 text-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.12)]"
          }`}
        >
          <div className="flex items-start gap-2.5 min-w-0">
            <div
              className={`p-1.5 rounded-xl border mt-0.5 flex-shrink-0 ${
                hasBreached
                  ? "bg-rose-500/20 border-rose-500/40 text-rose-400 animate-pulse"
                  : "bg-amber-500/20 border-amber-500/40 text-amber-400"
              }`}
            >
              {hasBreached ? (
                <AlertOctagon className="w-4 h-4 stroke-[2.5]" />
              ) : (
                <Flame className="w-4 h-4 stroke-[2.5]" />
              )}
            </div>
            <div className="min-w-0">
              <div className="text-xs font-bold flex items-center gap-1.5">
                <span>
                  {hasBreached
                    ? "Immediate Action Required: Budget Cap Exceeded"
                    : "Pacing Warning: Accelerated Daily Burn Rate"}
                </span>
              </div>
              <p className="text-[11px] opacity-90 mt-0.5 leading-snug">
                {hasBreached
                  ? `${breachedList.map((b) => b.category?.name).join(", ")} exceeded limits by ₹${formatINR(
                      totalOverspendAmount
                    )}. Adjust caps or curtail outflows.`
                  : `${overspendingList
                      .map((b) => b.category?.name)
                      .join(", ")} burning at ₹${formatINR(
                      overspendingList[0]?.dailyRunRate || 0
                    )}/day, projected to exceed cap by month-end.`}
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              const target = breachedList[0] || overspendingList[0];
              if (target) openEditModal(target);
            }}
            className={`px-2.5 py-1.5 rounded-xl text-[11px] font-bold border transition-all flex-shrink-0 active:scale-95 ${
              hasBreached
                ? "bg-rose-500/20 hover:bg-rose-500/30 border-rose-500/40 text-rose-200"
                : "bg-amber-500/20 hover:bg-amber-500/30 border-amber-500/40 text-amber-200"
            }`}
          >
            Adjust Cap
          </button>
        </div>
      )}

      {/* High-Level Overview Strip */}
      {summary.activeBudgetsCount > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4 p-3 rounded-xl bg-zinc-950/70 border border-zinc-850">
          <div>
            <div className="text-[10px] uppercase font-mono text-zinc-500">
              Allocated Cap {summary.totalRolledOver && summary.totalRolledOver > 0 ? "(+Rollover)" : ""}
            </div>
            <div className="text-xs sm:text-sm font-bold font-mono text-zinc-200">
              <PrivacyMask>{formatINR(displayTotalBudget)}</PrivacyMask>
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
              ) : hasOverspending || hasWarning ? (
                <span className="text-amber-400 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" />
                  {hasOverspending ? "High burn pace" : `${summary.warningCount} warning`}
                </span>
              ) : (
                <span className="text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  All guarded
                </span>
              )}
            </div>
          </div>

          {/* Daily Burn Rate & Runway Strip */}
          {summary.isCurrentMonth !== false && (summary.daysRemaining ?? 0) > 0 && (
            <div className="col-span-2 sm:col-span-4 mt-1.5 pt-2 border-t border-zinc-850 flex flex-wrap items-center justify-between gap-2 text-[11px]">
              <div className="flex items-center gap-3">
                <span className="text-zinc-400 flex items-center gap-1 font-mono">
                  <Zap className="w-3.5 h-3.5 text-amber-400" />
                  Run-Rate:{" "}
                  <span className="font-bold text-zinc-200">
                    <PrivacyMask>₹{formatINR(summary.avgDailyBurn || 0)}/day</PrivacyMask>
                  </span>
                </span>
                <span className="text-zinc-600">•</span>
                <span className="text-zinc-400 flex items-center gap-1 font-mono">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  Safe Cap:{" "}
                  <span className="font-bold text-emerald-400">
                    <PrivacyMask>₹{formatINR(summary.recommendedDailyBurn || 0)}/day</PrivacyMask>
                  </span>
                </span>
              </div>
              <div className="flex items-center gap-1.5 font-mono text-[10px] text-zinc-400 bg-zinc-900/90 px-2 py-0.5 rounded-md border border-zinc-800">
                <Calendar className="w-3 h-3 text-zinc-400" />
                <span>{summary.daysRemaining} days left</span>
              </div>
            </div>
          )}

          {/* Unallocated Headroom Strip (Income vs Budget) */}
          {summary.totalIncome !== undefined && summary.totalIncome > 0 && (
            <div className="col-span-2 sm:col-span-4 mt-1.5 pt-2 border-t border-zinc-850/80 flex flex-wrap items-center justify-between gap-2 text-[11px]">
              <div className="flex items-center gap-2">
                <span className="text-zinc-400 font-mono">Monthly Income:</span>
                <span className="font-bold text-emerald-400 font-mono">
                  <PrivacyMask>+{formatINR(summary.totalIncome)}</PrivacyMask>
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-zinc-400 font-mono">Unallocated Headroom:</span>
                <span
                  className={`font-bold font-mono ${
                    (summary.unallocatedHeadroom ?? 0) >= 0 ? "text-emerald-400" : "text-amber-400"
                  }`}
                >
                  <PrivacyMask>
                    {(summary.unallocatedHeadroom ?? 0) >= 0
                      ? `₹${formatINR(summary.unallocatedHeadroom || 0)} (${summary.unallocatedPercent}%)`
                      : `-₹${formatINR(Math.abs(summary.unallocatedHeadroom || 0))}`}
                  </PrivacyMask>
                </span>
              </div>
            </div>
          )}
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

            const effectiveLimit = b.effectiveLimit || b.monthlyLimit + (b.rolledOverAmount || 0);
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
                          / {formatINR(effectiveLimit)}
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
                  <div className="flex items-center justify-between text-[10px] gap-2">
                    <div className="flex items-center gap-1.5 flex-wrap min-w-0">
                      <span className="font-mono text-zinc-400">
                        {b.percentUsed}% burned
                      </span>

                      {b.todaySpent && b.todaySpent > 0 ? (
                        <span className="px-1.5 py-0.2 rounded bg-zinc-800 text-zinc-300 font-mono text-[9px] border border-zinc-700/60">
                          Today: +₹{formatINR(b.todaySpent)}
                        </span>
                      ) : null}

                      {b.rolledOverAmount && b.rolledOverAmount > 0 ? (
                        <span className="px-1.5 py-0.2 rounded bg-teal-500/15 text-teal-300 border border-teal-500/30 font-mono text-[9px] flex items-center gap-0.5">
                          <RotateCcw className="w-2.5 h-2.5" />
                          +₹{formatINR(b.rolledOverAmount)} Rollover
                        </span>
                      ) : null}

                      {b.burnPace === "OVERSPENDING" && (
                        <span className="px-1.5 py-0.2 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30 font-mono text-[9px] flex items-center gap-0.5">
                          <Flame className="w-2.5 h-2.5 text-amber-400" />
                          High Pace
                        </span>
                      )}

                      {b.burnPace === "ON_TRACK" && (b.recommendedDailySpend ?? 0) > 0 && (
                        <span className="text-zinc-500 font-mono text-[9px] hidden sm:inline">
                          (Safe: ₹{formatINR(b.recommendedDailySpend || 0)}/day)
                        </span>
                      )}
                    </div>

                    {isBreach ? (
                      <span className="font-semibold text-rose-400 flex items-center gap-1 font-mono flex-shrink-0">
                        <AlertTriangle className="w-3 h-3 stroke-[2.5]" />
                        Exceeded by <PrivacyMask>{formatINR(b.overspendAmount)}</PrivacyMask>
                      </span>
                    ) : isWarn ? (
                      <span className="font-semibold text-amber-400 flex items-center gap-1 font-mono flex-shrink-0">
                        <AlertTriangle className="w-3 h-3 stroke-[2.5]" />
                        <PrivacyMask>{formatINR(b.remaining)}</PrivacyMask> left before cap
                      </span>
                    ) : (
                      <span className="text-emerald-400/90 font-mono flex-shrink-0">
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

          <div className="flex flex-wrap items-center justify-center gap-2">
            {summary.previousMonthBudgetsCount && summary.previousMonthBudgetsCount > 0 ? (
              <button
                onClick={handleRolloverCopy}
                disabled={submitting}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-zinc-950 font-bold text-xs shadow-[0_0_15px_rgba(16,185,129,0.3)] transition-all active:scale-95 disabled:opacity-50"
              >
                <RotateCcw className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>
                  Copy {summary.previousMonthBudgetsCount} Budgets from {summary.previousMonth}
                </span>
              </button>
            ) : null}

            <button
              onClick={() => openAddModal()}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 text-zinc-200 font-semibold text-xs transition-colors active:scale-95"
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Set Custom Category Budget</span>
            </button>
          </div>
        </div>
      )}

      {/* Set / Edit Budget Modal */}
      {isModalOpen && mounted && createPortal(
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm transition-opacity"
          onClick={() => setIsModalOpen(false)}
        >
          <div
            className="relative w-full max-w-md max-h-[90vh] rounded-3xl bg-zinc-950 border border-zinc-800 shadow-2xl flex flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 sm:p-5 border-b border-zinc-850 shrink-0 bg-zinc-950/90 backdrop-blur-sm">
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
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-xl text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSave} className="p-4 sm:p-5 space-y-4 overflow-y-auto flex-1">
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

              {/* Rollover Toggle */}
              <div className="p-3 rounded-xl bg-zinc-900/60 border border-zinc-800 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-xs font-semibold text-zinc-200 flex items-center gap-1.5">
                    <RotateCcw className="w-3.5 h-3.5 text-teal-400" />
                    <span>Rollover Unspent Surplus</span>
                  </div>
                  <p className="text-[10px] text-zinc-400 mt-0.5">
                    Unspent headroom will roll over to boost next month's allowance
                  </p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={rolloverUnspent}
                  onClick={() => setRolloverUnspent(!rolloverUnspent)}
                  className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    rolloverUnspent ? "bg-teal-500" : "bg-zinc-800"
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-zinc-950 shadow ring-0 transition duration-200 ease-in-out ${
                      rolloverUnspent ? "translate-x-4" : "translate-x-0"
                    }`}
                  />
                </button>
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
              <div className="flex items-center justify-between gap-3 pt-3 border-t border-zinc-850 shrink-0">
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
        </div>,
        document.body
      )}
    </div>
  );
};

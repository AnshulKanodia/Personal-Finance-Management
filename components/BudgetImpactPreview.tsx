"use client";

import React, { useMemo } from "react";
import { ShieldCheck, AlertTriangle, ShieldAlert } from "lucide-react";
import { formatINR } from "@/lib/utils";
import { useBudgets } from "@/hooks/useBudgets";

export interface BudgetImpactPreviewProps {
  type: "EXPENSE" | "INCOME";
  categoryId: string;
  amount: number | string;
  date?: string; // YYYY-MM-DD
  originalAmount?: number; // for edit mode
  originalCategoryId?: string; // for edit mode
}

export function computeBudgetImpact({
  currentSpent,
  monthlyLimit,
  alertThreshold = 80,
  enteredAmount,
  originalAmount = 0,
  isSameCategory = true,
}: {
  currentSpent: number;
  monthlyLimit: number;
  alertThreshold?: number;
  enteredAmount: number;
  originalAmount?: number;
  isSameCategory?: boolean;
}) {
  const baseSpent = isSameCategory
    ? Math.max(0, currentSpent - originalAmount)
    : currentSpent;

  const projectedSpent = baseSpent + enteredAmount;
  const remaining = monthlyLimit - projectedSpent;
  const projectedPercent =
    monthlyLimit > 0 ? Math.round((projectedSpent / monthlyLimit) * 100) : 0;
  const overspendAmount = projectedSpent > monthlyLimit ? projectedSpent - monthlyLimit : 0;

  let status: "SAFE" | "WARNING" | "OVER_BUDGET" = "SAFE";
  if (projectedSpent >= monthlyLimit) {
    status = "OVER_BUDGET";
  } else if (projectedPercent >= alertThreshold) {
    status = "WARNING";
  }

  return {
    baseSpent,
    projectedSpent,
    remaining,
    projectedPercent,
    overspendAmount,
    status,
    barPercent: Math.min(100, Math.max(0, projectedPercent)),
  };
}

export const BudgetImpactPreview: React.FC<BudgetImpactPreviewProps> = ({
  type,
  categoryId,
  amount,
  date,
  originalAmount = 0,
  originalCategoryId,
}) => {
  // Only evaluate for expense transactions with a category selected
  const targetMonth = useMemo(() => {
    if (date && /^\d{4}-(0[1-9]|1[0-2])/.test(date)) {
      return date.slice(0, 7);
    }
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  }, [date]);

  const { budgets } = useBudgets(targetMonth);

  const budget = useMemo(() => {
    if (!categoryId || type !== "EXPENSE") return null;
    return (
      budgets.find((b) => {
        const catId = (b.category?._id || b.category)?.toString();
        return catId === categoryId && b.isActive !== false;
      }) || null
    );
  }, [budgets, categoryId, type]);

  if (!budget || type !== "EXPENSE") return null;

  const parsedAmount = typeof amount === "number" ? amount : parseFloat(amount) || 0;
  const isSameCategory = originalCategoryId ? originalCategoryId === categoryId : true;

  const effectiveCap =
    budget.effectiveLimit || budget.monthlyLimit + (budget.rolledOverAmount || 0);

  const impact = computeBudgetImpact({
    currentSpent: budget.spent,
    monthlyLimit: effectiveCap,
    alertThreshold: budget.alertThreshold || 80,
    enteredAmount: parsedAmount,
    originalAmount,
    isSameCategory,
  });

  const categoryName = budget.category?.name || "Category";
  const isBreach = impact.status === "OVER_BUDGET";
  const isWarn = impact.status === "WARNING";

  return (
    <div
      className={`p-3 rounded-2xl border transition-all duration-300 animate-in fade-in-50 slide-in-from-top-1 ${
        isBreach
          ? "bg-rose-500/10 border-rose-500/30 text-rose-300 shadow-[0_0_15px_rgba(244,63,94,0.12)]"
          : isWarn
          ? "bg-amber-500/10 border-amber-500/30 text-amber-300 shadow-[0_0_12px_rgba(245,158,11,0.1)]"
          : "bg-emerald-500/10 border-emerald-500/20 text-emerald-300 shadow-[0_0_10px_rgba(16,185,129,0.08)]"
      }`}
    >
      <div className="flex items-start justify-between gap-2.5 mb-1.5">
        <div className="flex items-center gap-2 min-w-0">
          <div
            className={`p-1.5 rounded-lg border flex-shrink-0 ${
              isBreach
                ? "bg-rose-500/20 border-rose-500/40 text-rose-400 animate-pulse"
                : isWarn
                ? "bg-amber-500/20 border-amber-500/40 text-amber-400"
                : "bg-emerald-500/20 border-emerald-500/40 text-emerald-400"
            }`}
          >
            {isBreach ? (
              <ShieldAlert className="w-3.5 h-3.5 stroke-[2.5]" />
            ) : isWarn ? (
              <AlertTriangle className="w-3.5 h-3.5 stroke-[2.5]" />
            ) : (
              <ShieldCheck className="w-3.5 h-3.5 stroke-[2.5]" />
            )}
          </div>
          <div className="min-w-0">
            <span className="text-xs font-bold truncate block">
              {isBreach
                ? `Exceeds ${categoryName} Cap by ₹${formatINR(impact.overspendAmount)}`
                : isWarn
                ? `Nearing ${categoryName} Limit (${impact.projectedPercent}%)`
                : `${categoryName} Budget: Safe Headroom`}
            </span>
          </div>
        </div>

        <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-zinc-950/80 border border-zinc-800 text-zinc-300 flex-shrink-0">
          {impact.projectedPercent}% cap
        </span>
      </div>

      {/* Micro Progress Bar */}
      <div className="h-1.5 w-full bg-zinc-950/80 rounded-full overflow-hidden p-0.5 border border-zinc-800/80 my-1.5">
        <div
          className={`h-full rounded-full transition-all duration-300 ease-out ${
            isBreach
              ? "bg-gradient-to-r from-rose-500 to-red-600 shadow-[0_0_8px_rgba(244,63,94,0.4)]"
              : isWarn
              ? "bg-gradient-to-r from-amber-500 to-orange-400 shadow-[0_0_6px_rgba(245,158,11,0.3)]"
              : "bg-gradient-to-r from-emerald-500 to-teal-400 shadow-[0_0_6px_rgba(16,185,129,0.25)]"
          }`}
          style={{ width: `${impact.barPercent}%` }}
        />
      </div>

      {/* Detail Footer */}
      <div className="flex items-center justify-between text-[10px] text-zinc-400 font-mono">
        <span>
          Projected:{" "}
          <span className="text-zinc-200 font-semibold">
            ₹{formatINR(impact.projectedSpent)}
          </span>{" "}
          / ₹{formatINR(effectiveCap)}
          {budget.rolledOverAmount && budget.rolledOverAmount > 0 ? (
            <span className="text-emerald-400 ml-1">
              (+₹{formatINR(budget.rolledOverAmount)} rollover)
            </span>
          ) : null}
        </span>

        {isBreach ? (
          <span className="text-rose-400 font-semibold">Soft limit • Safe to log</span>
        ) : (
          <span className="text-emerald-400">₹{formatINR(impact.remaining)} remaining</span>
        )}
      </div>
    </div>
  );
};

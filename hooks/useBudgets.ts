"use client";

import { useState, useEffect, useCallback } from "react";
import { getCached, setCached } from "@/lib/clientCache";

export interface BudgetCategory {
  _id: string;
  name: string;
  color: string;
  icon: string;
}

export interface BudgetWithMetrics {
  _id: string;
  category: BudgetCategory;
  monthlyLimit: number;
  month: string;
  alertThreshold: number;
  isActive: boolean;
  notes?: string;
  spent: number;
  remaining: number;
  percentUsed: number;
  transactionCount: number;
  status: "SAFE" | "WARNING" | "OVER_BUDGET";
  overspendAmount: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface BudgetSummary {
  totalBudget: number;
  totalSpent: number;
  totalRemaining: number;
  overallPercent: number;
  activeBudgetsCount: number;
  overBudgetCount: number;
  warningCount: number;
}

export interface SaveBudgetPayload {
  category: string;
  monthlyLimit: number;
  month?: string;
  alertThreshold?: number;
  notes?: string;
  isActive?: boolean;
}

export function useBudgets(selectedMonth?: string) {
  const now = new Date();
  const currentMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const targetMonth = selectedMonth || currentMonthStr;

  const [budgets, setBudgets] = useState<BudgetWithMetrics[]>([]);
  const [summary, setSummary] = useState<BudgetSummary>({
    totalBudget: 0,
    totalSpent: 0,
    totalRemaining: 0,
    overallPercent: 0,
    activeBudgetsCount: 0,
    overBudgetCount: 0,
    warningCount: 0,
  });
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const cacheKey = `budgets_${targetMonth}`;

  const fetchBudgets = useCallback(
    async (isSilent = false) => {
      try {
        if (!isSilent) setLoading(true);
        setError(null);

        const res = await fetch(`/api/budgets?month=${encodeURIComponent(targetMonth)}`);
        const json = await res.json();

        if (json.success) {
          setBudgets(json.data || []);
          if (json.summary) {
            setSummary(json.summary);
          }
          // Persist into hot SWR client cache
          setCached(cacheKey, {
            data: json.data || [],
            summary: json.summary || {
              totalBudget: 0,
              totalSpent: 0,
              totalRemaining: 0,
              overallPercent: 0,
              activeBudgetsCount: 0,
              overBudgetCount: 0,
              warningCount: 0,
            },
          });
        } else {
          setError(json.message || "Failed to load budgets");
        }
      } catch (err: any) {
        console.error("useBudgets fetch error:", err);
        setError(err.message || "Network error loading budgets");
      } finally {
        setLoading(false);
      }
    },
    [targetMonth, cacheKey]
  );

  // Initial load and SWR cache hydrate
  useEffect(() => {
    const cached = getCached<{ data: BudgetWithMetrics[]; summary: BudgetSummary }>(cacheKey);
    if (cached) {
      setBudgets(cached.data);
      setSummary(cached.summary);
      setLoading(false);
      // Background revalidate
      fetchBudgets(true);
    } else {
      fetchBudgets(false);
    }
  }, [fetchBudgets, cacheKey]);

  // Sync with global finance updates (e.g. transaction created, edited, deleted)
  useEffect(() => {
    const handleGlobalUpdate = () => fetchBudgets(true);
    window.addEventListener("finance_data_updated", handleGlobalUpdate);
    return () => window.removeEventListener("finance_data_updated", handleGlobalUpdate);
  }, [fetchBudgets]);

  // Create or Update Budget
  const saveBudget = async (payload: SaveBudgetPayload) => {
    try {
      const res = await fetch("/api/budgets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...payload,
          month: payload.month || targetMonth,
        }),
      });
      const json = await res.json();
      if (json.success) {
        await fetchBudgets(true);
        window.dispatchEvent(new CustomEvent("finance_data_updated"));
        return { success: true, data: json.data };
      } else {
        return { success: false, message: json.message || "Failed to save budget" };
      }
    } catch (err: any) {
      return { success: false, message: err.message || "Network error saving budget" };
    }
  };

  // Delete Budget
  const deleteBudget = async (budgetId: string) => {
    try {
      const res = await fetch(`/api/budgets/${budgetId}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (json.success) {
        await fetchBudgets(true);
        window.dispatchEvent(new CustomEvent("finance_data_updated"));
        return { success: true };
      } else {
        return { success: false, message: json.message || "Failed to delete budget" };
      }
    } catch (err: any) {
      return { success: false, message: err.message || "Network error deleting budget" };
    }
  };

  return {
    budgets,
    summary,
    loading,
    error,
    refresh: () => fetchBudgets(false),
    saveBudget,
    deleteBudget,
  };
}

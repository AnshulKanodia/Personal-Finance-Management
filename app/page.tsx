"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  TrendingDown,
  Wallet,
  ArrowDownLeft,
  ArrowUpRight,
  TrendingUp,
  ReceiptIndianRupee,
  Plus,
  ChevronLeft,
  ChevronRight,
  Calendar,
  CreditCard,
  Send,
  Coins,
  RefreshCw,
} from "lucide-react";
import { StatCard } from "@/components/StatCard";
import { SpendCategoryChart } from "@/components/SpendCategoryChart";
import { CategoryIcon } from "@/components/CategoryIcon";
import { formatINR, formatDate } from "@/lib/utils";
import { QuickTransactionModal } from "@/components/QuickTransactionModal";
import { QuickDueModal } from "@/components/QuickDueModal";

interface DashboardData {
  totalSpendThisMonth: number;
  totalIncomeThisMonth: number;
  cashBalance: number;
  netOwedToMe: number;
  netIOwe: number;
  categorySpend: any[];
  paymentModes: any[];
  recentTransactions: any[];
  month: string;
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  });

  const [quickAddType, setQuickAddType] = useState<"EXPENSE" | "INCOME" | null>(null);
  const [quickDueOpen, setQuickDueOpen] = useState(false);

  const fetchDashboard = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/dashboard?month=${currentMonth}`);
      const json = await res.json();
      if (json.success) {
        setData(json.data);
      }
    } catch (e) {
      console.error("Dashboard fetch error:", e);
    } finally {
      setLoading(false);
    }
  }, [currentMonth]);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  // Listen to global updates
  useEffect(() => {
    const handleUpdate = () => fetchDashboard();
    window.addEventListener("finance_data_updated", handleUpdate);
    return () => window.removeEventListener("finance_data_updated", handleUpdate);
  }, [fetchDashboard]);

  const handleMonthChange = (offset: number) => {
    const [year, month] = currentMonth.split("-").map(Number);
    const date = new Date(year, month - 1 + offset, 1);
    setCurrentMonth(`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`);
  };

  const getMonthLabel = (monthStr: string) => {
    const [year, month] = monthStr.split("-").map(Number);
    const d = new Date(year, month - 1, 1);
    return d.toLocaleString("en-IN", { month: "long", year: "numeric" });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Header & Month Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-zinc-100">
            Financial Overview
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1">
            Tracking INR expenses, liquid cash, and friend splits
          </p>
        </div>

        {/* Month Selector */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <div className="flex items-center bg-zinc-900 border border-zinc-800 rounded-xl p-1 text-xs font-medium">
            <button
              onClick={() => handleMonthChange(-1)}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
              title="Previous month"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-1.5 px-3 font-semibold text-zinc-200 min-w-[130px] justify-center">
              <Calendar className="w-3.5 h-3.5 text-emerald-400" />
              <span>{getMonthLabel(currentMonth)}</span>
            </div>
            <button
              onClick={() => handleMonthChange(1)}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
              title="Next month"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={() => fetchDashboard()}
            className="p-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-emerald-400" : ""}`} />
          </button>
        </div>
      </div>

      {/* 4 Core Top Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Spend (Month)"
          amount={data?.totalSpendThisMonth ?? 0}
          icon={TrendingDown}
          variant="rose"
          subtitle="Monthly Outflow"
          badge="Expenses"
        />

        <StatCard
          title="Liquid Cash Balance"
          amount={data?.cashBalance ?? 0}
          icon={Wallet}
          variant={data && data.cashBalance >= 0 ? "emerald" : "rose"}
          subtitle="Total Net Inflow"
          badge="Reserve"
        />

        <StatCard
          title="Net Owed To Me"
          amount={data?.netOwedToMe ?? 0}
          icon={ArrowDownLeft}
          variant="emerald"
          subtitle="Receivables from friends"
          badge="To Take"
        />

        <StatCard
          title="Net I Owe"
          amount={data?.netIOwe ?? 0}
          icon={ArrowUpRight}
          variant="amber"
          subtitle="Payables to friends"
          badge="To Give"
        />
      </div>

      {/* Quick Action Bar */}
      <div className="grid grid-cols-3 gap-3">
        <button
          onClick={() => setQuickAddType("EXPENSE")}
          className="p-3 sm:p-4 rounded-2xl bg-zinc-900/60 border border-rose-500/20 hover:border-rose-500/40 hover:bg-rose-500/5 transition-all text-left flex items-center justify-between group"
        >
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 group-hover:scale-110 transition-transform">
              <TrendingDown className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div>
              <div className="text-xs sm:text-sm font-bold text-zinc-200">Log Expense</div>
              <div className="text-[10px] text-zinc-500 hidden sm:block">Outflow payment</div>
            </div>
          </div>
          <Plus className="w-4 h-4 text-zinc-500 group-hover:text-rose-400" />
        </button>

        <button
          onClick={() => setQuickAddType("INCOME")}
          className="p-3 sm:p-4 rounded-2xl bg-zinc-900/60 border border-emerald-500/20 hover:border-emerald-500/40 hover:bg-emerald-500/5 transition-all text-left flex items-center justify-between group"
        >
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform">
              <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div>
              <div className="text-xs sm:text-sm font-bold text-zinc-200">Add Income</div>
              <div className="text-[10px] text-zinc-500 hidden sm:block">Salary or credit</div>
            </div>
          </div>
          <Plus className="w-4 h-4 text-zinc-500 group-hover:text-emerald-400" />
        </button>

        <button
          onClick={() => setQuickDueOpen(true)}
          className="p-3 sm:p-4 rounded-2xl bg-zinc-900/60 border border-sky-500/20 hover:border-sky-500/40 hover:bg-sky-500/5 transition-all text-left flex items-center justify-between group"
        >
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400 group-hover:scale-110 transition-transform">
              <Send className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div>
              <div className="text-xs sm:text-sm font-bold text-zinc-200">Khaata Split</div>
              <div className="text-[10px] text-zinc-500 hidden sm:block">Friend ledger due</div>
            </div>
          </div>
          <Plus className="w-4 h-4 text-zinc-500 group-hover:text-sky-400" />
        </button>
      </div>

      {/* Middle Section: Spend Donut Chart + Payment Modes Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Category Chart (takes 2 columns) */}
        <div className="lg:col-span-2">
          <SpendCategoryChart data={data?.categorySpend || []} />
        </div>

        {/* Payment Modes Summary */}
        <div className="rounded-2xl bg-zinc-900/60 backdrop-blur-md border border-zinc-800/80 p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium tracking-wider text-zinc-400 uppercase">
                Payment Channels
              </h3>
              <span className="text-[10px] text-zinc-500 font-mono">This Month</span>
            </div>

            <div className="space-y-3">
              {[
                {
                  id: "UPI",
                  label: "UPI (GPay / PhonePe / Paytm)",
                  icon: Send,
                  border: "border-sky-500/20",
                  text: "text-sky-400",
                  bg: "bg-sky-500/10",
                },
                {
                  id: "CASH",
                  label: "Cash Payments",
                  icon: Coins,
                  border: "border-amber-500/20",
                  text: "text-amber-400",
                  bg: "bg-amber-500/10",
                },
                {
                  id: "CARD",
                  label: "Credit / Debit Cards",
                  icon: CreditCard,
                  border: "border-violet-500/20",
                  text: "text-violet-400",
                  bg: "bg-violet-500/10",
                },
              ].map((channel) => {
                const Icon = channel.icon;
                const expense =
                  data?.paymentModes.find(
                    (p) => p._id.mode === channel.id && p._id.type === "EXPENSE"
                  )?.total || 0;

                return (
                  <div
                    key={channel.id}
                    className={`p-3.5 rounded-xl bg-zinc-950/60 border ${channel.border} flex items-center justify-between`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${channel.bg} ${channel.text}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-zinc-200">{channel.label}</div>
                        <div className="text-[10px] text-zinc-500">Spend Outflow</div>
                      </div>
                    </div>
                    <div className={`text-sm font-bold font-mono ${channel.text}`}>
                      {formatINR(expense)}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-zinc-800/80 flex items-center justify-between text-xs">
            <span className="text-zinc-400">Total Income This Month</span>
            <span className="font-bold text-emerald-400 font-mono">
              +{formatINR(data?.totalIncomeThisMonth ?? 0)}
            </span>
          </div>
        </div>
      </div>

      {/* Bottom Section: Recent Transactions */}
      <div className="rounded-2xl bg-zinc-900/60 backdrop-blur-md border border-zinc-800/80 p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-medium tracking-wider text-zinc-400 uppercase">
              Recent Transactions
            </h3>
            <p className="text-xs text-zinc-500">Latest entries across categories</p>
          </div>
          <Link
            href="/transactions"
            className="text-xs text-emerald-400 hover:text-emerald-300 font-medium flex items-center gap-1 hover:underline"
          >
            <span>View All</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {data?.recentTransactions && data.recentTransactions.length > 0 ? (
          <div className="divide-y divide-zinc-850">
            {data.recentTransactions.map((tx: any) => {
              const isExpense = tx.type === "EXPENSE";
              const cat = tx.category || { name: "General", color: "#71717a", icon: "Tag" };

              return (
                <div
                  key={tx._id}
                  className="py-3.5 flex items-center justify-between group hover:bg-zinc-900/40 px-2 rounded-xl transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="p-2.5 rounded-xl border flex items-center justify-center"
                      style={{
                        backgroundColor: `${cat.color}15`,
                        borderColor: `${cat.color}30`,
                        color: cat.color,
                      }}
                    >
                      <CategoryIcon name={cat.icon} className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-zinc-200">
                        {tx.notes || cat.name}
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-zinc-500 mt-0.5">
                        <span>{formatDate(tx.date)}</span>
                        <span>•</span>
                        <span className="px-1.5 py-0.2 rounded bg-zinc-800/80 text-zinc-400 text-[10px] font-mono">
                          {tx.paymentMode}
                        </span>
                        {tx.notes && <span>• {cat.name}</span>}
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div
                      className={`text-sm sm:text-base font-bold font-mono ${
                        isExpense ? "text-rose-400" : "text-emerald-400"
                      }`}
                    >
                      {isExpense ? "-" : "+"}
                      {formatINR(tx.amount)}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-10">
            <ReceiptIndianRupee className="w-10 h-10 text-zinc-600 mx-auto mb-2" />
            <p className="text-sm text-zinc-400">No transactions recorded yet</p>
            <button
              onClick={() => setQuickAddType("EXPENSE")}
              className="mt-3 text-xs text-emerald-400 hover:text-emerald-300 font-semibold"
            >
              + Log your first expense
            </button>
          </div>
        )}
      </div>

      {/* Modals */}
      <QuickTransactionModal
        isOpen={quickAddType !== null}
        initialType={quickAddType || "EXPENSE"}
        onClose={() => setQuickAddType(null)}
        onSuccess={() => fetchDashboard()}
      />

      <QuickDueModal
        isOpen={quickDueOpen}
        onClose={() => setQuickDueOpen(false)}
        onSuccess={() => fetchDashboard()}
      />
    </div>
  );
}

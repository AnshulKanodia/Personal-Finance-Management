"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Plus,
  Search,
  Filter,
  Trash2,
  Edit2,
  Calendar,
  ReceiptIndianRupee,
  ChevronDown,
  X,
  CreditCard,
  Send,
  Coins,
  RefreshCw,
} from "lucide-react";
import { CategoryIcon } from "@/components/CategoryIcon";
import { formatINR, formatDate } from "@/lib/utils";
import { QuickTransactionModal } from "@/components/QuickTransactionModal";
import { EditTransactionModal } from "@/components/EditTransactionModal";

import { getCached, setCached, clearCache } from "@/lib/clientCache";

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
  };
  notes?: string;
  date: string;
}

interface Category {
  _id: string;
  name: string;
  color: string;
  icon: string;
}

export default function TransactionsPage() {
  // Filters
  const [typeFilter, setTypeFilter] = useState<string>("ALL");
  const [categoryFilter, setCategoryFilter] = useState<string>("ALL");
  const [modeFilter, setModeFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [monthFilter, setMonthFilter] = useState<string>(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  });

  const [transactions, setTransactions] = useState<TransactionItem[]>(() =>
    getCached<TransactionItem[]>(`txs_${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}_ALL_ALL_ALL_`) || []
  );
  const [categories, setCategories] = useState<Category[]>(() =>
    getCached<Category[]>("all_categories") || []
  );
  const [loading, setLoading] = useState(() => transactions.length === 0);
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<TransactionItem | null>(null);

  const fetchTransactions = useCallback(async (isSilent = false) => {
    try {
      if (!isSilent) setLoading(true);
      const params = new URLSearchParams();
      if (typeFilter !== "ALL") params.append("type", typeFilter);
      if (categoryFilter !== "ALL") params.append("category", categoryFilter);
      if (modeFilter !== "ALL") params.append("paymentMode", modeFilter);
      if (searchQuery.trim()) params.append("search", searchQuery.trim());
      if (monthFilter) params.append("month", monthFilter);

      const res = await fetch(`/api/transactions?${params.toString()}`);
      const json = await res.json();
      if (json.success) {
        setTransactions(json.data);
        const key = `txs_${monthFilter}_${typeFilter}_${categoryFilter}_${modeFilter}_${searchQuery}`;
        setCached(key, json.data);
      }
    } catch (e) {
      console.error("Failed to fetch transactions:", e);
    } finally {
      setLoading(false);
    }
  }, [typeFilter, categoryFilter, modeFilter, searchQuery, monthFilter]);

  useEffect(() => {
    const key = `txs_${monthFilter}_${typeFilter}_${categoryFilter}_${modeFilter}_${searchQuery}`;
    const cached = getCached<TransactionItem[]>(key);
    if (cached) {
      setTransactions(cached);
      setLoading(false);
      fetchTransactions(true);
    } else {
      fetchTransactions(false);
    }
  }, [fetchTransactions, monthFilter, typeFilter, categoryFilter, modeFilter, searchQuery]);

  useEffect(() => {
    const cachedCats = getCached<Category[]>("all_categories");
    if (cachedCats) {
      setCategories(cachedCats);
    }
    fetch("/api/categories")
      .then((res) => res.json())
      .then((json) => {
        if (json.success) {
          const sorted = [...json.data].sort((a: Category, b: Category) =>
            a.name.localeCompare(b.name)
          );
          setCategories(sorted);
          setCached("all_categories", sorted);
        }
      })
      .catch(console.error);
  }, []);

  // Compute filtered summary stats
  const totalExpense = transactions
    .filter((t) => t.type === "EXPENSE")
    .reduce((sum, t) => sum + t.amount, 0);

  const totalIncome = transactions
    .filter((t) => t.type === "INCOME")
    .reduce((sum, t) => sum + t.amount, 0);

  const netBalance = totalIncome - totalExpense;

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this transaction?")) return;
    try {
      const res = await fetch(`/api/transactions/${id}`, { method: "DELETE" });
      const json = await res.json();
      if (json.success) {
        clearCache();
        window.dispatchEvent(new CustomEvent("finance_data_updated"));
        setTransactions((prev) => prev.filter((t) => t._id !== id));
      }
    } catch (e) {
      console.error("Delete failed", e);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-zinc-100">
            Expense Tracker
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1">
            Log and review all INR cash flows, UPI transfers, and card payments
          </p>
        </div>

        <button
          onClick={() => setQuickAddOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-400 hover:from-emerald-400 hover:to-emerald-300 text-zinc-950 font-bold text-xs sm:text-sm shadow-[0_0_20px_rgba(16,185,129,0.3)] transition-all self-start sm:self-auto active:scale-95"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>New Transaction</span>
        </button>
      </div>

      {/* Filtered Period Summary Banner */}
      <div className="grid grid-cols-3 gap-3 p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 backdrop-blur-md">
        <div>
          <span className="text-[10px] sm:text-xs uppercase font-medium tracking-wider text-zinc-400">
            Period Inflow
          </span>
          <div className="text-base sm:text-xl font-bold font-mono text-emerald-400 mt-0.5 truncate">
            +{formatINR(totalIncome)}
          </div>
        </div>

        <div>
          <span className="text-[10px] sm:text-xs uppercase font-medium tracking-wider text-zinc-400">
            Period Outflow
          </span>
          <div className="text-base sm:text-xl font-bold font-mono text-rose-400 mt-0.5 truncate">
            -{formatINR(totalExpense)}
          </div>
        </div>

        <div>
          <span className="text-[10px] sm:text-xs uppercase font-medium tracking-wider text-zinc-400">
            Net Savings
          </span>
          <div
            className={`text-base sm:text-xl font-bold font-mono mt-0.5 truncate ${
              netBalance >= 0 ? "text-emerald-400" : "text-rose-400"
            }`}
          >
            {formatINR(netBalance)}
          </div>
        </div>
      </div>

      {/* Filters Toolbar */}
      <div className="p-4 rounded-2xl bg-zinc-900/40 border border-zinc-850 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search */}
          <div className="relative">
            <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search notes / remarks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-zinc-200 focus:outline-none focus:border-emerald-500 placeholder:text-zinc-600"
            />
          </div>

          {/* Month */}
          <div>
            <input
              type="month"
              value={monthFilter}
              onChange={(e) => setMonthFilter(e.target.value)}
              className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-zinc-200 focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Type Filter */}
          <div>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-zinc-200 focus:outline-none focus:border-emerald-500"
            >
              <option value="ALL">All Types (Income & Expense)</option>
              <option value="EXPENSE">Expenses Only (-₹)</option>
              <option value="INCOME">Income Only (+₹)</option>
            </select>
          </div>

          {/* Payment Mode */}
          <div>
            <select
              value={modeFilter}
              onChange={(e) => setModeFilter(e.target.value)}
              className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-zinc-200 focus:outline-none focus:border-emerald-500"
            >
              <option value="ALL">All Modes (UPI, Cash, Card)</option>
              <option value="UPI">UPI</option>
              <option value="CASH">Cash</option>
              <option value="CARD">Card</option>
              <option value="NET_BANKING">Net Banking</option>
            </select>
          </div>
        </div>

        {/* Category Pills Bar */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-1">
          <button
            onClick={() => setCategoryFilter("ALL")}
            className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-colors border ${
              categoryFilter === "ALL"
                ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/40"
                : "bg-zinc-950 text-zinc-400 border-zinc-800 hover:border-zinc-700"
            }`}
          >
            All Categories
          </button>
          {categories.map((c) => (
            <button
              key={c._id}
              onClick={() => setCategoryFilter(c._id)}
              className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-colors border flex items-center gap-1.5 ${
                categoryFilter === c._id
                  ? "bg-zinc-800 text-zinc-100 border-zinc-600"
                  : "bg-zinc-950 text-zinc-400 border-zinc-800 hover:border-zinc-700"
              }`}
            >
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: c.color }} />
              <span>{c.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Transactions List */}
      <div className="rounded-2xl bg-zinc-900/60 backdrop-blur-md border border-zinc-800/80 overflow-hidden">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center text-zinc-500">
            <RefreshCw className="w-8 h-8 animate-spin text-emerald-400 mb-3" />
            <span className="text-xs">Loading ledger records...</span>
          </div>
        ) : transactions.length === 0 ? (
          <div className="py-16 text-center">
            <ReceiptIndianRupee className="w-12 h-12 text-zinc-700 mx-auto mb-3" />
            <h3 className="text-sm font-semibold text-zinc-300">No transactions found</h3>
            <p className="text-xs text-zinc-500 mt-1 max-w-sm mx-auto">
              No transactions matched your selected filters or search parameters.
            </p>
            <button
              onClick={() => {
                setTypeFilter("ALL");
                setCategoryFilter("ALL");
                setModeFilter("ALL");
                setSearchQuery("");
              }}
              className="mt-4 px-3 py-1.5 rounded-lg bg-zinc-800 text-zinc-300 hover:bg-zinc-700 text-xs font-medium"
            >
              Clear Filters
            </button>
          </div>
        ) : (
          <div className="divide-y divide-zinc-850">
            {transactions.map((tx) => {
              const isExpense = tx.type === "EXPENSE";
              const cat = tx.category || { name: "General", color: "#71717a", icon: "Tag" };

              return (
                <div
                  key={tx._id}
                  className="p-4 hover:bg-zinc-900/40 transition-colors flex items-center justify-between group"
                >
                  <div className="flex items-center gap-3.5">
                    <div
                      className="p-3 rounded-2xl border flex items-center justify-center flex-shrink-0"
                      style={{
                        backgroundColor: `${cat.color}15`,
                        borderColor: `${cat.color}35`,
                        color: cat.color,
                      }}
                    >
                      <CategoryIcon name={cat.icon} className="w-5 h-5" />
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-zinc-100">
                          {tx.notes || cat.name}
                        </span>
                        {tx.notes && (
                          <span className="text-[11px] px-2 py-0.5 rounded-md bg-zinc-850 text-zinc-400 border border-zinc-800">
                            {cat.name}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 text-xs text-zinc-400 mt-1">
                        <span>{formatDate(tx.date)}</span>
                        <span>•</span>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-mono font-semibold ${
                            tx.paymentMode === "UPI"
                              ? "bg-sky-500/10 text-sky-400 border border-sky-500/20"
                              : tx.paymentMode === "CASH"
                              ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                              : "bg-violet-500/10 text-violet-400 border border-violet-500/20"
                          }`}
                        >
                          {tx.paymentMode}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div
                        className={`text-base sm:text-lg font-black font-mono tracking-tight ${
                          isExpense ? "text-rose-400" : "text-emerald-400"
                        }`}
                      >
                        {isExpense ? "-" : "+"}
                        {formatINR(tx.amount)}
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setEditingTransaction(tx)}
                        className="p-2 rounded-lg text-zinc-500 hover:text-emerald-400 hover:bg-emerald-500/10 transition-colors opacity-80 group-hover:opacity-100"
                        title="Edit transaction"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => handleDelete(tx._id)}
                        className="p-2 rounded-lg text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors opacity-80 group-hover:opacity-100"
                        title="Delete transaction"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add Modal */}
      <QuickTransactionModal
        isOpen={quickAddOpen}
        onClose={() => setQuickAddOpen(false)}
        onSuccess={() => fetchTransactions()}
      />

      {/* Edit Modal */}
      <EditTransactionModal
        isOpen={editingTransaction !== null}
        transaction={editingTransaction}
        onClose={() => setEditingTransaction(null)}
        onSuccess={() => fetchTransactions()}
      />
    </div>
  );
}

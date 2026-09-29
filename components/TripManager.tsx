"use client";

import React, { useState, useEffect } from "react";
import {
  Users,
  Plus,
  ArrowRight,
  TrendingDown,
  TrendingUp,
  Receipt,
  CheckCircle,
  Calendar,
  Trash2,
  Share2,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Plane,
} from "lucide-react";
import { formatINR, formatDate } from "@/lib/utils";
import { simplifyGroupDebts, GroupSettlementAnalysis } from "@/lib/debtSimplifier";

interface TripMember {
  friendId?: string;
  name: string;
}

interface TripExpense {
  _id?: string;
  description: string;
  amount: number;
  paidBy: string;
  splitType: "EQUAL" | "EXACT";
  splitBetween: { name: string; shareAmount: number }[];
  date: string;
}

interface TripGroup {
  _id: string;
  title: string;
  description?: string;
  members: TripMember[];
  expenses: TripExpense[];
  status: "ACTIVE" | "ARCHIVED";
  createdAt: string;
}

interface TripManagerProps {
  existingFriends: { _id: string; name: string }[];
  onRefresh?: () => void;
}

export const TripManager: React.FC<TripManagerProps> = ({ existingFriends }) => {
  const [groups, setGroups] = useState<TripGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedGroupId, setExpandedGroupId] = useState<string | null>(null);

  // Create Group Modal State
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [selectedFriendIds, setSelectedFriendIds] = useState<string[]>([]);
  const [customMembers, setCustomMembers] = useState<string>("");
  const [submittingGroup, setSubmittingGroup] = useState(false);

  // Add Expense to Group Modal State
  const [activeGroupForExpense, setActiveGroupForExpense] = useState<TripGroup | null>(null);
  const [expenseDesc, setExpenseDesc] = useState("");
  const [expenseAmount, setExpenseAmount] = useState("");
  const [expensePaidBy, setExpensePaidBy] = useState("You");
  const [submittingExpense, setSubmittingExpense] = useState(false);
  const [expenseError, setExpenseError] = useState("");

  const fetchGroups = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/groups");
      const json = await res.json();
      if (json.success) {
        setGroups(json.data || []);
        if (json.data && json.data.length > 0 && !expandedGroupId) {
          setExpandedGroupId(json.data[0]._id);
        }
      }
    } catch (e) {
      console.error("Failed to load groups:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGroups();
  }, []);

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    try {
      setSubmittingGroup(true);
      const members: { friendId?: string; name: string }[] = [{ name: "You" }];

      selectedFriendIds.forEach((id) => {
        const found = existingFriends.find((f) => f._id === id);
        if (found) {
          members.push({ friendId: found._id, name: found.name });
        }
      });

      if (customMembers.trim()) {
        const customNames = customMembers
          .split(",")
          .map((n) => n.trim())
          .filter(Boolean);
        customNames.forEach((name) => {
          if (!members.some((m) => m.name.toLowerCase() === name.toLowerCase())) {
            members.push({ name });
          }
        });
      }

      const res = await fetch("/api/groups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newTitle.trim(),
          description: newDesc.trim(),
          members,
        }),
      });

      const json = await res.json();
      if (json.success) {
        setIsCreateOpen(false);
        setNewTitle("");
        setNewDesc("");
        setSelectedFriendIds([]);
        setCustomMembers("");
        await fetchGroups();
        if (json.data?._id) setExpandedGroupId(json.data._id);
      }
    } catch (e) {
      console.error("Failed to create group:", e);
    } finally {
      setSubmittingGroup(false);
    }
  };

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeGroupForExpense) return;
    const numAmount = Number(expenseAmount);
    if (!numAmount || numAmount <= 0) {
      setExpenseError("Please enter a valid amount");
      return;
    }
    if (!expenseDesc.trim()) {
      setExpenseError("Please enter a description");
      return;
    }

    try {
      setSubmittingExpense(true);
      setExpenseError("");

      // Equal split by default across all group members
      const membersCount = activeGroupForExpense.members.length;
      const sharePerMember = Math.round((numAmount / membersCount) * 100) / 100;
      const splitBetween = activeGroupForExpense.members.map((m) => ({
        name: m.name,
        shareAmount: sharePerMember,
      }));

      const res = await fetch(`/api/groups/${activeGroupForExpense._id}/expenses`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          description: expenseDesc.trim(),
          amount: numAmount,
          paidBy: expensePaidBy,
          splitType: "EQUAL",
          splitBetween,
          date: new Date().toISOString(),
        }),
      });

      const json = await res.json();
      if (json.success) {
        setActiveGroupForExpense(null);
        setExpenseDesc("");
        setExpenseAmount("");
        setExpensePaidBy("You");
        await fetchGroups();
      } else {
        setExpenseError(json.message || "Failed to add expense");
      }
    } catch (e: any) {
      setExpenseError(e.message || "An error occurred");
    } finally {
      setSubmittingExpense(false);
    }
  };

  const handleDeleteGroup = async (groupId: string, title: string) => {
    if (!confirm(`Are you sure you want to delete "${title}"? This cannot be undone.`)) return;
    try {
      const res = await fetch(`/api/groups/${groupId}`, { method: "DELETE" });
      const json = await res.json();
      if (json.success) {
        await fetchGroups();
      }
    } catch (e) {
      console.error("Failed to delete group:", e);
    }
  };

  const toggleSelectFriend = (id: string) => {
    setSelectedFriendIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  if (loading && groups.length === 0) {
    return (
      <div className="py-12 text-center text-zinc-400 text-xs">
        Loading trips and group splits...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl glass-panel border border-zinc-800">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-tr from-sky-600/30 to-indigo-600/30 border border-sky-500/30 text-sky-400 shadow-[0_0_15px_rgba(14,165,233,0.2)]">
            <Plane className="w-5 h-5 stroke-[2.2]" />
          </div>
          <div>
            <h2 className="text-base font-bold text-zinc-100 flex items-center gap-2">
              <span>Trips & Group Splits</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-sky-500/10 text-sky-400 border border-sky-500/20 font-mono">
                Debt Simplifier
              </span>
            </h2>
            <p className="text-xs text-zinc-400 mt-0.5">
              Multi-person events, vacations, and shared outings with automatic settlement solver
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsCreateOpen(true)}
          className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-500 hover:from-sky-400 hover:to-indigo-400 text-zinc-950 font-bold text-xs transition-all flex items-center justify-center gap-1.5 shadow-[0_0_20px_rgba(14,165,233,0.3)] active:scale-95"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>New Trip / Group</span>
        </button>
      </div>

      {/* Groups List */}
      {groups.length === 0 ? (
        <div className="text-center py-14 rounded-2xl border border-zinc-800/80 bg-zinc-900/30 p-6">
          <Plane className="w-12 h-12 text-zinc-600 mx-auto mb-3 stroke-[1.8]" />
          <h3 className="text-base font-bold text-zinc-300">No Trips or Groups Yet</h3>
          <p className="text-xs text-zinc-500 mt-1 max-w-sm mx-auto">
            Create a group for an upcoming trip (like Goa, Manali), apartment rent split, or dinner with multiple friends.
          </p>
          <button
            onClick={() => setIsCreateOpen(true)}
            className="mt-4 px-4 py-2 rounded-xl bg-sky-500/10 hover:bg-sky-500/20 border border-sky-500/30 text-sky-400 font-semibold text-xs transition-colors"
          >
            Create Your First Group
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {groups.map((group) => {
            const isExpanded = expandedGroupId === group._id;
            const analysis: GroupSettlementAnalysis = simplifyGroupDebts(
              group.members,
              group.expenses
            );

            return (
              <div
                key={group._id}
                className="rounded-2xl glass-panel border border-zinc-800 overflow-hidden transition-all duration-200"
              >
                {/* Trip Card Summary Bar */}
                <div
                  onClick={() => setExpandedGroupId(isExpanded ? null : group._id)}
                  className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer hover:bg-zinc-900/40 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-sky-400 font-bold text-sm shadow-inner">
                      {group.title.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-bold text-zinc-100">{group.title}</h3>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono">
                          {group.status}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-zinc-400 mt-1">
                        <span>{group.members.length} members</span>
                        <span>•</span>
                        <span>{group.expenses.length} expenses logged</span>
                        {group.description && (
                          <>
                            <span>•</span>
                            <span className="text-zinc-500 truncate max-w-xs">{group.description}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t border-zinc-850 sm:border-0">
                    <div className="text-left sm:text-right">
                      <div className="text-[10px] uppercase font-mono text-zinc-500">Group Total</div>
                      <div className="text-lg font-black font-mono text-zinc-100">
                        {formatINR(analysis.totalGroupSpend)}
                      </div>
                    </div>

                    <div className="p-2 rounded-xl text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800">
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </div>
                  </div>
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="p-4 sm:p-5 border-t border-zinc-850/80 bg-zinc-950/40 space-y-5 animate-in fade-in duration-200">
                    {/* Action Bar */}
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider font-mono">
                        Settlement & Balances
                      </span>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setActiveGroupForExpense(group);
                            setExpenseDesc("");
                            setExpenseAmount("");
                            setExpensePaidBy("You");
                            setExpenseError("");
                          }}
                          className="px-3.5 py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 font-bold text-xs transition-colors flex items-center gap-1.5 shadow-sm"
                        >
                          <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                          <span>Add Expense</span>
                        </button>

                        <button
                          onClick={() => handleDeleteGroup(group._id, group.title)}
                          className="p-1.5 rounded-xl text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                          title="Delete Group"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Member Net Position Cards */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                      {analysis.memberSummaries.map((m) => (
                        <div
                          key={m.name}
                          className="p-3 rounded-xl bg-zinc-900/60 border border-zinc-800/80 flex flex-col justify-between"
                        >
                          <div className="text-xs font-bold text-zinc-200 truncate">{m.name}</div>
                          <div className="mt-2">
                            <div className="text-[10px] text-zinc-500 font-mono">
                              Paid: {formatINR(m.totalPaid)}
                            </div>
                            <div
                              className={`text-sm font-extrabold font-mono mt-0.5 ${
                                m.netBalance > 0
                                  ? "text-emerald-400"
                                  : m.netBalance < 0
                                  ? "text-rose-400"
                                  : "text-zinc-500"
                              }`}
                            >
                              {m.netBalance > 0
                                ? `+${formatINR(m.netBalance)}`
                                : m.netBalance < 0
                                ? `-${formatINR(Math.abs(m.netBalance))}`
                                : "Settled"}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Minimal Settlement Solver Steps */}
                    <div className="p-4 rounded-xl bg-zinc-900/80 border border-zinc-800 space-y-3">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-zinc-300 flex items-center gap-1.5">
                          <Sparkles className="w-3.5 h-3.5 text-sky-400" />
                          <span>Simplest Settlement Plan (Minimum Cash Transfers)</span>
                        </span>
                        <span className="text-[10px] text-zinc-500 font-mono">
                          {analysis.simplifiedDebts.length} transfer{analysis.simplifiedDebts.length !== 1 ? "s" : ""} needed
                        </span>
                      </div>

                      {analysis.simplifiedDebts.length === 0 ? (
                        <div className="text-xs text-emerald-400 font-medium py-1">
                          🎉 All members are completely settled up! No transfers needed.
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {analysis.simplifiedDebts.map((debt, idx) => (
                            <div
                              key={idx}
                              className="p-2.5 rounded-lg bg-zinc-950 border border-zinc-800 flex items-center justify-between text-xs font-medium"
                            >
                              <div className="flex items-center gap-2">
                                <span className="text-rose-400 font-bold">{debt.from}</span>
                                <ArrowRight className="w-3.5 h-3.5 text-zinc-500" />
                                <span className="text-emerald-400 font-bold">{debt.to}</span>
                              </div>
                              <div className="font-mono font-bold text-zinc-100">
                                {formatINR(debt.amount)}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Expense History inside Group */}
                    {group.expenses.length > 0 && (
                      <div className="space-y-2">
                        <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider font-mono">
                          Expenses History
                        </span>
                        <div className="divide-y divide-zinc-850 rounded-xl border border-zinc-800/80 bg-zinc-900/40 px-3">
                          {group.expenses.map((exp: any, i: number) => (
                            <div key={i} className="py-2.5 flex items-center justify-between text-xs">
                              <div>
                                <div className="font-semibold text-zinc-200">{exp.description}</div>
                                <div className="text-[11px] text-zinc-500 mt-0.5">
                                  Paid by <span className="text-zinc-300 font-medium">{exp.paidBy}</span> •{" "}
                                  {formatDate(exp.date)}
                                </div>
                              </div>
                              <div className="font-mono font-bold text-zinc-200">
                                {formatINR(exp.amount)}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Create Group Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-2xl bg-zinc-950 border border-zinc-800 p-5 sm:p-6 shadow-2xl relative">
            <h3 className="text-base font-bold text-zinc-100 flex items-center gap-2">
              <Plane className="w-4 h-4 text-sky-400" />
              <span>Create New Trip / Group</span>
            </h3>
            <p className="text-xs text-zinc-400 mt-1">
              Set up a group for a shared vacation, rent split, or dinner party
            </p>

            <form onSubmit={handleCreateGroup} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1">
                  Trip / Group Title *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Goa Trip 2026, Flat 402 Rent"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-100 text-xs focus:outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1">
                  Description / Notes (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Flight, Airbnb and food splits"
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-100 text-xs focus:outline-none focus:border-sky-500"
                />
              </div>

              {/* Select from existing friends */}
              {existingFriends.length > 0 && (
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1.5">
                    Select Friends from Contacts:
                  </label>
                  <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto p-1.5 rounded-xl bg-zinc-900/60 border border-zinc-800/80">
                    {existingFriends.map((f) => {
                      const isSelected = selectedFriendIds.includes(f._id);
                      return (
                        <button
                          key={f._id}
                          type="button"
                          onClick={() => toggleSelectFriend(f._id)}
                          className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                            isSelected
                              ? "bg-sky-500 text-zinc-950 font-bold"
                              : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
                          }`}
                        >
                          {f.name} {isSelected && "✓"}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1">
                  Add Additional Names (Comma separated):
                </label>
                <input
                  type="text"
                  placeholder="e.g. Priya, Rohit, Ananya"
                  value={customMembers}
                  onChange={(e) => setCustomMembers(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-100 text-xs focus:outline-none focus:border-sky-500"
                />
                <span className="text-[10px] text-zinc-500 mt-1 block">
                  You are automatically included as a member in every group.
                </span>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-850">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-4 py-2 rounded-xl border border-zinc-800 bg-zinc-900 text-xs font-medium text-zinc-400 hover:text-zinc-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingGroup || !newTitle.trim()}
                  className="px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-zinc-950 font-bold text-xs transition-all shadow-[0_0_15px_rgba(14,165,233,0.3)] disabled:opacity-50"
                >
                  {submittingGroup ? "Creating..." : "Create Group"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Expense Modal */}
      {activeGroupForExpense && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-2xl bg-zinc-950 border border-zinc-800 p-5 sm:p-6 shadow-2xl relative">
            <h3 className="text-base font-bold text-zinc-100 flex items-center gap-2">
              <Receipt className="w-4 h-4 text-emerald-400" />
              <span>Add Group Expense</span>
            </h3>
            <p className="text-xs text-zinc-400 mt-1">
              Adding to <span className="text-zinc-200 font-semibold">{activeGroupForExpense.title}</span>
            </p>

            {expenseError && (
              <div className="mt-3 text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 py-1.5 px-3 rounded-xl font-medium">
                {expenseError}
              </div>
            )}

            <form onSubmit={handleAddExpense} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1">
                  Description *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Seafood Dinner, Fuel, Airbnb Advance"
                  value={expenseDesc}
                  onChange={(e) => setExpenseDesc(e.target.value)}
                  required
                  autoFocus
                  className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-100 text-xs focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1">
                  Amount *
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-zinc-500">
                    ₹
                  </span>
                  <input
                    type="number"
                    step="any"
                    placeholder="0"
                    value={expenseAmount}
                    onChange={(e) => setExpenseAmount(e.target.value)}
                    required
                    className="w-full pl-8 pr-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-100 font-mono text-base font-bold focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1">
                  Who Paid?
                </label>
                <select
                  value={expensePaidBy}
                  onChange={(e) => setExpensePaidBy(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-100 text-xs focus:outline-none focus:border-emerald-500"
                >
                  {activeGroupForExpense.members.map((m) => (
                    <option key={m.name} value={m.name}>
                      {m.name}
                    </option>
                  ))}
                </select>
                <span className="text-[10px] text-zinc-500 mt-1 block">
                  Expense will be split equally among all {activeGroupForExpense.members.length} members.
                </span>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-850">
                <button
                  type="button"
                  onClick={() => setActiveGroupForExpense(null)}
                  className="px-4 py-2 rounded-xl border border-zinc-800 bg-zinc-900 text-xs font-medium text-zinc-400 hover:text-zinc-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingExpense || !expenseAmount}
                  className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-xs transition-all shadow-[0_0_15px_rgba(16,185,129,0.3)] disabled:opacity-50"
                >
                  {submittingExpense ? "Logging..." : "Save Expense"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

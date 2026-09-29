"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Users,
  Plus,
  ArrowUpRight,
  ArrowDownLeft,
  CheckCircle,
  Clock,
  Phone,
  Trash2,
  IndianRupee,
  RefreshCw,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Filter,
} from "lucide-react";
import { formatINR, formatDate } from "@/lib/utils";
import { QuickDueModal } from "@/components/QuickDueModal";
import { SettleUpModal } from "@/components/SettleUpModal";
import { RupeeLoader } from "@/components/RupeeLoader";

import { getCached, setCached } from "@/lib/clientCache";

interface Friend {
  _id: string;
  name: string;
  phone?: string;
  toGive: number;
  toTake: number;
  netBalance: number;
  unsettledCount: number;
}

interface DueItem {
  _id: string;
  friendId: {
    _id: string;
    name: string;
    phone?: string;
  };
  amount: number;
  type: "TO_GIVE" | "TO_TAKE";
  paymentMode: "UPI" | "CASH";
  isSettled: boolean;
  settledAt?: string;
  notes?: string;
  date: string;
  createdAt?: string;
}

export default function LedgerPage() {
  const [friends, setFriends] = useState<Friend[]>(() => getCached<Friend[]>("ledger_friends") || []);
  const [activeDues, setActiveDues] = useState<DueItem[]>(() => getCached<DueItem[]>("ledger_active_dues") || []);
  const [settledDues, setSettledDues] = useState<DueItem[]>(() => getCached<DueItem[]>("ledger_settled_dues") || []);
  const [loading, setLoading] = useState(() => friends.length === 0);
  const [activeTab, setActiveTab] = useState<"ACTIVE" | "HISTORY">("ACTIVE");
  const [historyFriendFilter, setHistoryFriendFilter] = useState<string>("ALL");

  // Modals
  const [quickDueOpen, setQuickDueOpen] = useState(false);
  const [preselectedFriendId, setPreselectedFriendId] = useState<string | undefined>(undefined);
  const [settleFriend, setSettleFriend] = useState<Friend | null>(null);
  const [expandedFriendId, setExpandedFriendId] = useState<string | null>(null);

  const fetchData = useCallback(async (isSilent = false) => {
    try {
      if (!isSilent) setLoading(true);
      const [friendsRes, activeDuesRes, settledDuesRes] = await Promise.all([
        fetch("/api/friends"),
        fetch("/api/dues?isSettled=false"),
        fetch("/api/dues?isSettled=true"),
      ]);

      const friendsJson = await friendsRes.json();
      const activeDuesJson = await activeDuesRes.json();
      const settledDuesJson = await settledDuesRes.json();

      if (friendsJson.success) {
        setFriends(friendsJson.data);
        setCached("ledger_friends", friendsJson.data);
      }
      if (activeDuesJson.success) {
        setActiveDues(activeDuesJson.data);
        setCached("ledger_active_dues", activeDuesJson.data);
      }
      if (settledDuesJson.success) {
        setSettledDues(settledDuesJson.data);
        setCached("ledger_settled_dues", settledDuesJson.data);
      }
    } catch (e) {
      console.error("Failed to load Ledger data", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const cachedFriends = getCached<Friend[]>("ledger_friends");
    if (cachedFriends) {
      setFriends(cachedFriends);
      setLoading(false);
      fetchData(true);
    } else {
      fetchData(false);
    }
  }, [fetchData]);

  useEffect(() => {
    const handleUpdate = () => fetchData(true);
    window.addEventListener("finance_data_updated", handleUpdate);
    return () => window.removeEventListener("finance_data_updated", handleUpdate);
  }, [fetchData]);

  // Aggregate totals from true net balances
  const totalToTake = friends.reduce((sum, f) => sum + (f.netBalance > 0 ? f.netBalance : 0), 0);
  const totalToGive = friends.reduce((sum, f) => sum + (f.netBalance < 0 ? Math.abs(f.netBalance) : 0), 0);
  const netPosition = totalToTake - totalToGive;

  // Filter friends into columns
  const toGiveFriends = friends.filter((f) => f.netBalance < 0);
  const toTakeFriends = friends.filter((f) => f.netBalance > 0);
  const settledFriends = friends.filter((f) => f.netBalance === 0);

  const [dueTypeToOpen, setDueTypeToOpen] = useState<"TO_TAKE" | "TO_GIVE">("TO_TAKE");

  const openAddDueForFriend = (friendId: string, initialType: "TO_TAKE" | "TO_GIVE" = "TO_TAKE") => {
    setPreselectedFriendId(friendId);
    setDueTypeToOpen(initialType);
    setQuickDueOpen(true);
  };

  // Filter settled dues
  const filteredSettledDues = settledDues.filter((d) => {
    if (historyFriendFilter === "ALL") return true;
    return d.friendId?._id === historyFriendFilter;
  });

  const totalSettledAmount = filteredSettledDues.reduce((sum, d) => sum + d.amount, 0);

  if (loading && friends.length === 0) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <RupeeLoader label="Loading ledger dues..." />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300 pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-zinc-100 flex items-center gap-2">
            <span>Friend Ledger</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono">
              Bilateral Passbook
            </span>
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1">
            Running passbook with friends — payments, splits, and deposits auto-adjust into one net balance
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={() => {
              setPreselectedFriendId(undefined);
              setDueTypeToOpen("TO_TAKE");
              setQuickDueOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-sky-400 hover:from-emerald-400 hover:to-sky-300 text-zinc-950 font-bold text-xs sm:text-sm shadow-[0_0_20px_rgba(16,185,129,0.3)] transition-all active:scale-95"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Add Entry / Deposit</span>
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 sm:p-5 rounded-2xl bg-zinc-900/60 border border-emerald-500/20 backdrop-blur-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
              Total To Take
            </span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
              <ArrowDownLeft className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-emerald-400 mt-3 font-mono">
            +{formatINR(totalToTake)}
          </div>
          <p className="text-xs text-zinc-500 mt-1">Net money friends owe you</p>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-zinc-900/60 border border-rose-500/20 backdrop-blur-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
              Total To Give
            </span>
            <div className="p-2 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/30">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-rose-400 mt-3 font-mono">
            -{formatINR(totalToGive)}
          </div>
          <p className="text-xs text-zinc-500 mt-1">Net money you owe friends</p>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 backdrop-blur-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
              Net Position
            </span>
            <div className="p-2 rounded-xl bg-zinc-800 text-zinc-300 border border-zinc-700">
              <IndianRupee className="w-4 h-4 stroke-[2.2]" />
            </div>
          </div>
          <div
            className={`text-2xl sm:text-3xl font-black mt-3 font-mono ${
              netPosition >= 0 ? "text-emerald-400" : "text-rose-400"
            }`}
          >
            {netPosition >= 0 ? "+" : ""}
            {formatINR(netPosition)}
          </div>
          <p className="text-xs text-zinc-500 mt-1">Single overall balance</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-zinc-800 pb-3">
        <button
          onClick={() => setActiveTab("ACTIVE")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === "ACTIVE"
              ? "bg-zinc-800 text-zinc-100 border border-zinc-700 shadow-inner"
              : "text-zinc-500 hover:text-zinc-300"
          }`}
        >
          Active Ledgers ({friends.filter((f) => f.netBalance !== 0).length})
        </button>
        <button
          onClick={() => setActiveTab("HISTORY")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === "HISTORY"
              ? "bg-zinc-800 text-zinc-100 border border-zinc-700 shadow-inner"
              : "text-zinc-500 hover:text-zinc-300"
          }`}
        >
          Settled History ({settledDues.length})
        </button>
      </div>

      {activeTab === "ACTIVE" ? (
        /* Two Columns Layout: "To Give" and "To Take" */
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Column 1: TO TAKE (Money owed to me) */}
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30">
              <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
                <ArrowDownLeft className="w-4 h-4 stroke-[3]" />
                <span>To Take (Owed to Me)</span>
              </div>
              <span className="text-xs font-black font-mono text-emerald-400">
                +{formatINR(totalToTake)}
              </span>
            </div>

            {toTakeFriends.length === 0 ? (
              <div className="p-8 rounded-2xl bg-zinc-900/30 border border-zinc-850 text-center">
                <CheckCircle className="w-8 h-8 text-zinc-600 mx-auto mb-2" />
                <p className="text-xs text-zinc-400">No one currently owes you money</p>
              </div>
            ) : (
              toTakeFriends.map((friend) => {
                const isExpanded = expandedFriendId === friend._id;
                const friendDues = activeDues.filter(
                  (d) => d.friendId && d.friendId._id === friend._id
                );

                return (
                  <div
                    key={friend._id}
                    className="rounded-2xl bg-zinc-900/70 border border-zinc-800/80 hover:border-emerald-500/30 transition-all p-4 relative overflow-hidden group shadow-lg"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-xl bg-zinc-800 border border-zinc-700/80 flex items-center justify-center font-bold text-sm text-zinc-200">
                          {friend.name[0]?.toUpperCase() || "F"}
                        </div>
                        <div>
                          <h4 className="text-base font-bold text-zinc-100">{friend.name}</h4>
                          {friend.phone && (
                            <div className="flex items-center gap-1 text-[11px] text-zinc-500 mt-0.5">
                              <Phone className="w-3 h-3 text-zinc-600" />
                              <span>{friend.phone}</span>
                            </div>
                          )}
                          <div className="flex items-center gap-2 mt-1.5">
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 font-semibold border border-emerald-500/20">
                              Owes you net
                            </span>
                            <span className="text-[10px] text-zinc-500">
                              {friend.unsettledCount} pending split{friend.unsettledCount > 1 ? "s" : ""}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="text-xl sm:text-2xl font-black font-mono text-emerald-400">
                          +{formatINR(friend.netBalance)}
                        </div>
                        <span className="text-[10px] uppercase tracking-wider text-zinc-500 font-semibold">
                          Net Balance
                        </span>
                      </div>
                    </div>

                    {/* Action Buttons: Add deposit or lent split & Settle */}
                    <div className="mt-4 pt-3 border-t border-zinc-800/80 flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => openAddDueForFriend(friend._id, "TO_GIVE")}
                          className="px-2.5 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-750 text-zinc-200 hover:text-emerald-300 text-xs font-semibold border border-zinc-700/60 transition-all flex items-center gap-1"
                          title="Friend paid or deposited money to you (decreases what he owes)"
                        >
                          <Plus className="w-3 h-3 text-emerald-400" />
                          <span>+ Received</span>
                        </button>

                        <button
                          onClick={() => openAddDueForFriend(friend._id, "TO_TAKE")}
                          className="px-2.5 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-750 text-zinc-200 hover:text-rose-300 text-xs font-semibold border border-zinc-700/60 transition-all flex items-center gap-1"
                          title="You spent or lent more to friend (increases what he owes)"
                        >
                          <Plus className="w-3 h-3 text-rose-400" />
                          <span>- Spent / Lent</span>
                        </button>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() =>
                            setExpandedFriendId(isExpanded ? null : friend._id)
                          }
                          className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 text-xs flex items-center gap-1 transition-colors"
                        >
                          <span>{isExpanded ? "Hide" : "Details"}</span>
                          {isExpanded ? (
                            <ChevronUp className="w-3.5 h-3.5" />
                          ) : (
                            <ChevronDown className="w-3.5 h-3.5" />
                          )}
                        </button>

                        <button
                          onClick={() => setSettleFriend(friend)}
                          className="px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-zinc-950 text-xs font-bold transition-all shadow-[0_0_12px_rgba(16,185,129,0.3)] active:scale-95"
                        >
                          Settle Up
                        </button>
                      </div>
                    </div>

                    {/* Expandable passbook entry breakdown */}
                    {isExpanded && (
                      <div className="mt-3 pt-3 border-t border-zinc-850 space-y-2 animate-in fade-in duration-200">
                        <div className="text-[11px] font-semibold text-zinc-400 mb-1">
                          Passbook Movement Breakdown:
                        </div>
                        {friendDues.length === 0 ? (
                          <div className="text-xs text-zinc-500 py-1">
                            No individual line items loaded.
                          </div>
                        ) : (
                          friendDues.map((d) => (
                            <div
                              key={d._id}
                              className="p-2.5 rounded-lg bg-zinc-950/70 border border-zinc-850 flex items-center justify-between text-xs"
                            >
                              <div>
                                <div className="text-zinc-200 font-medium">
                                  {d.notes ||
                                    (d.type === "TO_TAKE"
                                      ? "You spent / lent"
                                      : "He paid / deposited")}
                                </div>
                                <div className="text-[10px] text-zinc-500 mt-0.5">
                                  {formatDate(d.date)} • {d.paymentMode} •{" "}
                                  <span
                                    className={
                                      d.type === "TO_TAKE"
                                        ? "text-rose-400"
                                        : "text-emerald-400"
                                    }
                                  >
                                    {d.type === "TO_TAKE"
                                      ? "Owed to you (+)"
                                      : "Received (-)"}
                                  </span>
                                </div>
                              </div>
                              <span
                                className={`font-mono font-bold text-sm ${
                                  d.type === "TO_TAKE"
                                    ? "text-rose-400"
                                    : "text-emerald-400"
                                }`}
                              >
                                {d.type === "TO_TAKE" ? "+" : "-"}
                                {formatINR(d.amount)}
                              </span>
                            </div>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Column 2: TO GIVE (Money I owe others) */}
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded-xl bg-rose-500/10 border border-rose-500/30">
              <div className="flex items-center gap-2 text-rose-400 font-bold text-sm">
                <ArrowUpRight className="w-4 h-4 stroke-[3]" />
                <span>To Give (You Owe)</span>
              </div>
              <span className="text-xs font-black font-mono text-rose-400">
                -{formatINR(totalToGive)}
              </span>
            </div>

            {toGiveFriends.length === 0 ? (
              <div className="p-8 rounded-2xl bg-zinc-900/30 border border-zinc-850 text-center">
                <CheckCircle className="w-8 h-8 text-zinc-600 mx-auto mb-2" />
                <p className="text-xs text-zinc-400">You do not owe money to anyone</p>
              </div>
            ) : (
              toGiveFriends.map((friend) => {
                const isExpanded = expandedFriendId === friend._id;
                const friendDues = activeDues.filter(
                  (d) => d.friendId && d.friendId._id === friend._id
                );

                return (
                  <div
                    key={friend._id}
                    className="rounded-2xl bg-zinc-900/70 border border-zinc-800/80 hover:border-rose-500/30 transition-all p-4 relative overflow-hidden group shadow-lg"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-xl bg-zinc-800 border border-zinc-700/80 flex items-center justify-center font-bold text-sm text-zinc-200">
                          {friend.name[0]?.toUpperCase() || "F"}
                        </div>
                        <div>
                          <h4 className="text-base font-bold text-zinc-100">{friend.name}</h4>
                          {friend.phone && (
                            <div className="flex items-center gap-1 text-[11px] text-zinc-500 mt-0.5">
                              <Phone className="w-3 h-3 text-zinc-600" />
                              <span>{friend.phone}</span>
                            </div>
                          )}
                          <div className="flex items-center gap-2 mt-1.5">
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-400 font-semibold border border-rose-500/20">
                              You owe net
                            </span>
                            <span className="text-[10px] text-zinc-500">
                              {friend.unsettledCount} pending split{friend.unsettledCount > 1 ? "s" : ""}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="text-xl sm:text-2xl font-black font-mono text-rose-400">
                          -{formatINR(Math.abs(friend.netBalance))}
                        </div>
                        <span className="text-[10px] uppercase tracking-wider text-zinc-500 font-semibold">
                          Net Balance
                        </span>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="mt-4 pt-3 border-t border-zinc-800/80 flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => openAddDueForFriend(friend._id, "TO_GIVE")}
                          className="px-2.5 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-750 text-zinc-200 hover:text-emerald-300 text-xs font-semibold border border-zinc-700/60 transition-all flex items-center gap-1"
                        >
                          <Plus className="w-3 h-3 text-emerald-400" />
                          <span>+ Deposit</span>
                        </button>

                        <button
                          onClick={() => openAddDueForFriend(friend._id, "TO_TAKE")}
                          className="px-2.5 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-750 text-zinc-200 hover:text-rose-300 text-xs font-semibold border border-zinc-700/60 transition-all flex items-center gap-1"
                        >
                          <Plus className="w-3 h-3 text-rose-400" />
                          <span>- Spent</span>
                        </button>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() =>
                            setExpandedFriendId(isExpanded ? null : friend._id)
                          }
                          className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 text-xs flex items-center gap-1 transition-colors"
                        >
                          <span>{isExpanded ? "Hide" : "Details"}</span>
                          {isExpanded ? (
                            <ChevronUp className="w-3.5 h-3.5" />
                          ) : (
                            <ChevronDown className="w-3.5 h-3.5" />
                          )}
                        </button>

                        <button
                          onClick={() => setSettleFriend(friend)}
                          className="px-3 py-1.5 rounded-lg bg-rose-500 hover:bg-rose-400 text-zinc-950 text-xs font-bold transition-all shadow-[0_0_12px_rgba(244,63,94,0.3)] active:scale-95"
                        >
                          Settle Up
                        </button>
                      </div>
                    </div>

                    {/* Expandable details */}
                    {isExpanded && (
                      <div className="mt-3 pt-3 border-t border-zinc-850 space-y-2 animate-in fade-in duration-200">
                        <div className="text-[11px] font-semibold text-zinc-400 mb-1">
                          Passbook Movement Breakdown:
                        </div>
                        {friendDues.length === 0 ? (
                          <div className="text-xs text-zinc-500 py-1">
                            No individual line items loaded.
                          </div>
                        ) : (
                          friendDues.map((d) => (
                            <div
                              key={d._id}
                              className="p-2.5 rounded-lg bg-zinc-950/70 border border-zinc-850 flex items-center justify-between text-xs"
                            >
                              <div>
                                <div className="text-zinc-200 font-medium">
                                  {d.notes ||
                                    (d.type === "TO_TAKE"
                                      ? "You spent / lent"
                                      : "He paid / deposited")}
                                </div>
                                <div className="text-[10px] text-zinc-500 mt-0.5">
                                  {formatDate(d.date)} • {d.paymentMode} •{" "}
                                  <span
                                    className={
                                      d.type === "TO_TAKE"
                                        ? "text-rose-400"
                                        : "text-emerald-400"
                                    }
                                  >
                                    {d.type === "TO_TAKE"
                                      ? "Owed to you (+)"
                                      : "Received (-)"}
                                  </span>
                                </div>
                              </div>
                              <span
                                className={`font-mono font-bold text-sm ${
                                  d.type === "TO_TAKE"
                                    ? "text-rose-400"
                                    : "text-emerald-400"
                                }`}
                              >
                                {d.type === "TO_TAKE" ? "+" : "-"}
                                {formatINR(d.amount)}
                              </span>
                            </div>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      ) : (
        /* Settled History Tab - Revamped for high visibility */
        <div className="space-y-4">
          {/* History Header & Summary Banner */}
          <div className="p-4 sm:p-5 rounded-2xl bg-zinc-900/70 border border-zinc-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-emerald-400" />
                <h3 className="text-base font-bold text-zinc-100">Settled Dues Audit Archive</h3>
              </div>
              <p className="text-xs text-zinc-400 mt-0.5">
                Past bilateral dues and deposits that have been completely settled to zero
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="text-left sm:text-right">
                <span className="text-[10px] uppercase tracking-wider text-zinc-500 font-semibold block">
                  Total Settled Volume
                </span>
                <span className="text-lg font-black font-mono text-emerald-400">
                  {formatINR(totalSettledAmount)}
                </span>
              </div>
              <span className="px-2.5 py-1 rounded-xl bg-zinc-800 text-xs font-mono text-zinc-300 border border-zinc-700">
                {filteredSettledDues.length} Records
              </span>
            </div>
          </div>

          {/* Friend Filter Chips for History */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-2">
            <button
              onClick={() => setHistoryFriendFilter("ALL")}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all whitespace-nowrap ${
                historyFriendFilter === "ALL"
                  ? "bg-emerald-500/10 border-emerald-500/40 text-emerald-300"
                  : "bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:border-zinc-700"
              }`}
            >
              All Friends ({settledDues.length})
            </button>
            {friends.map((f) => {
              const count = settledDues.filter((d) => d.friendId && d.friendId._id === f._id).length;
              if (count === 0) return null;
              return (
                <button
                  key={f._id}
                  onClick={() => setHistoryFriendFilter(f._id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all whitespace-nowrap ${
                    historyFriendFilter === f._id
                      ? "bg-emerald-500/10 border-emerald-500/40 text-emerald-300"
                      : "bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:border-zinc-700"
                  }`}
                >
                  {f.name} ({count})
                </button>
              );
            })}
          </div>

          {/* Settled Records List */}
          <div className="rounded-2xl bg-zinc-900/60 border border-zinc-800 overflow-hidden shadow-xl">
            {filteredSettledDues.length === 0 ? (
              <div className="py-16 text-center">
                <CheckCircle className="w-12 h-12 text-zinc-700 mx-auto mb-3" />
                <h4 className="text-sm font-semibold text-zinc-300">No Settled Records Found</h4>
                <p className="text-xs text-zinc-500 mt-1 max-w-sm mx-auto">
                  When you or your friends click &quot;Settle Up&quot; to clear your passbook, those cleared transactions will be archived here.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-zinc-800">
                {filteredSettledDues.map((item) => {
                  const isTake = item.type === "TO_TAKE";
                  const friendName = item.friendId?.name || "Friend";

                  return (
                    <div
                      key={item._id}
                      className="p-4 sm:p-5 flex items-center justify-between hover:bg-zinc-900/40 transition-colors"
                    >
                      <div className="flex items-center gap-3.5">
                        <div className="w-10 h-10 rounded-xl bg-zinc-800/80 border border-zinc-700 flex items-center justify-center font-bold text-sm text-zinc-200 flex-shrink-0">
                          {friendName[0]?.toUpperCase() || "F"}
                        </div>

                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-zinc-100">{friendName}</span>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                              <CheckCircle className="w-3 h-3" />
                              <span>Settled</span>
                            </span>
                          </div>

                          <div className="text-xs text-zinc-300 mt-0.5">
                            {item.notes || (isTake ? "Money spent for friend" : "Deposit received from friend")}
                          </div>

                          <div className="flex items-center gap-2 text-[11px] text-zinc-500 mt-1">
                            <span>Logged: {formatDate(item.date)}</span>
                            {item.settledAt && (
                              <>
                                <span>•</span>
                                <span className="text-zinc-400">Settled: {formatDate(item.settledAt)}</span>
                              </>
                            )}
                            <span>•</span>
                            <span className="font-mono text-[10px] px-1.5 py-0.2 bg-zinc-800 rounded text-zinc-400">
                              {item.paymentMode}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="text-right">
                        <div
                          className={`text-base sm:text-lg font-black font-mono tracking-tight ${
                            isTake ? "text-zinc-300 line-through" : "text-zinc-300 line-through"
                          }`}
                        >
                          {formatINR(item.amount)}
                        </div>
                        <span className="text-[10px] text-emerald-400 font-semibold block mt-0.5">
                          Cleared to ₹0
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Quick Due Modal */}
      <QuickDueModal
        isOpen={quickDueOpen}
        preselectedFriendId={preselectedFriendId}
        initialType={dueTypeToOpen}
        onClose={() => {
          setQuickDueOpen(false);
          setPreselectedFriendId(undefined);
        }}
        onSuccess={() => fetchData()}
      />

      {/* Settle Up Modal */}
      <SettleUpModal
        isOpen={settleFriend !== null}
        friend={settleFriend}
        onClose={() => setSettleFriend(null)}
        onSuccess={() => fetchData()}
      />
    </div>
  );
}

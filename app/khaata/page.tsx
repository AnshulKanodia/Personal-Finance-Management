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
  ReceiptIndianRupee,
  RefreshCw,
  Sparkles,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { formatINR, formatDate } from "@/lib/utils";
import { QuickDueModal } from "@/components/QuickDueModal";
import { SettleUpModal } from "@/components/SettleUpModal";

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
  notes?: string;
  date: string;
}

export default function KhaataPage() {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [dues, setDues] = useState<DueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"ACTIVE" | "HISTORY">("ACTIVE");

  // Modals
  const [quickDueOpen, setQuickDueOpen] = useState(false);
  const [preselectedFriendId, setPreselectedFriendId] = useState<string | undefined>(undefined);
  const [settleFriend, setSettleFriend] = useState<Friend | null>(null);
  const [expandedFriendId, setExpandedFriendId] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [friendsRes, duesRes] = await Promise.all([
        fetch("/api/friends"),
        fetch(`/api/dues?isSettled=${activeTab === "HISTORY" ? "true" : "false"}`),
      ]);

      const friendsJson = await friendsRes.json();
      const duesJson = await duesRes.json();

      if (friendsJson.success) setFriends(friendsJson.data);
      if (duesJson.success) setDues(duesJson.data);
    } catch (e) {
      console.error("Failed to load Khaata data", e);
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Aggregate totals
  const totalToTake = friends.reduce((sum, f) => sum + f.toTake, 0);
  const totalToGive = friends.reduce((sum, f) => sum + f.toGive, 0);
  const netPosition = totalToTake - totalToGive;

  // Filter friends into Two Columns:
  // "To Give" friends: Net I owe them (netBalance < 0)
  // "To Take" friends: Net they owe me (netBalance > 0)
  const toGiveFriends = friends.filter((f) => f.netBalance < 0);
  const toTakeFriends = friends.filter((f) => f.netBalance > 0);
  const settledFriends = friends.filter((f) => f.netBalance === 0 && f.unsettledCount === 0);

  const handleDeleteFriend = async (id: string, name: string) => {
    if (!confirm(`Delete ${name} and all their records from Khaata?`)) return;
    try {
      const res = await fetch(`/api/friends/${id}`, { method: "DELETE" });
      const json = await res.json();
      if (json.success) {
        fetchData();
      }
    } catch (e) {
      console.error("Failed to delete friend", e);
    }
  };

  const openAddDueForFriend = (friendId: string) => {
    setPreselectedFriendId(friendId);
    setQuickDueOpen(true);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-zinc-100 flex items-center gap-2">
            <span>Khaata</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono">
              Friend Ledger
            </span>
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1">
            Track split bills, group expenses, and settle balances seamlessly
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={() => {
              setPreselectedFriendId(undefined);
              setQuickDueOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-sky-400 hover:from-emerald-400 hover:to-sky-300 text-zinc-950 font-bold text-xs sm:text-sm shadow-[0_0_20px_rgba(16,185,129,0.3)] transition-all active:scale-95"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Add Due / Split</span>
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-zinc-900/60 border border-emerald-500/20 backdrop-blur-md">
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
          <p className="text-xs text-zinc-500 mt-1">Friends owe you</p>
        </div>

        <div className="p-5 rounded-2xl bg-zinc-900/60 border border-rose-500/20 backdrop-blur-md">
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
          <p className="text-xs text-zinc-500 mt-1">You owe friends</p>
        </div>

        <div className="p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 backdrop-blur-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
              Net Position
            </span>
            <div className="p-2 rounded-xl bg-zinc-800 text-zinc-300 border border-zinc-700">
              <ReceiptIndianRupee className="w-4 h-4" />
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
          <p className="text-xs text-zinc-500 mt-1">Overall balance</p>
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
          Settled History
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
              <div className="p-8 text-center rounded-2xl bg-zinc-900/40 border border-zinc-850">
                <p className="text-xs text-zinc-500">No one owes you money right now 🎉</p>
              </div>
            ) : (
              toTakeFriends.map((f) => {
                const friendDues = dues.filter(
                  (d) => d.friendId?._id === f._id || (d.friendId as any) === f._id
                );
                const isExpanded = expandedFriendId === f._id;

                return (
                  <div
                    key={f._id}
                    className="p-5 rounded-2xl bg-zinc-900/60 border border-emerald-500/20 hover:border-emerald-500/40 transition-all shadow-lg"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-base font-bold text-zinc-100">{f.name}</h3>
                          {f.phone && (
                            <span className="text-[11px] text-zinc-500 flex items-center gap-1">
                              <Phone className="w-3 h-3" />
                              {f.phone}
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-emerald-400 font-semibold mt-1">
                          Owes you: +{formatINR(f.netBalance)}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setSettleFriend(f)}
                          className="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 text-xs font-bold transition-all shadow-[0_0_12px_rgba(16,185,129,0.3)] active:scale-95"
                        >
                          Settle Up
                        </button>
                        <button
                          onClick={() => openAddDueForFriend(f._id)}
                          className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300"
                          title="Add entry for this friend"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Breakdown Toggle */}
                    <button
                      onClick={() => setExpandedFriendId(isExpanded ? null : f._id)}
                      className="mt-3 w-full pt-2 border-t border-zinc-800/80 flex items-center justify-between text-[11px] text-zinc-400 hover:text-zinc-200"
                    >
                      <span>
                        {f.unsettledCount} unsettled entr{f.unsettledCount > 1 ? "ies" : "y"}
                      </span>
                      {isExpanded ? (
                        <ChevronUp className="w-3.5 h-3.5" />
                      ) : (
                        <ChevronDown className="w-3.5 h-3.5" />
                      )}
                    </button>

                    {/* Detailed List */}
                    {isExpanded && (
                      <div className="mt-2 space-y-1.5 pt-2 border-t border-zinc-850">
                        {friendDues.map((d) => (
                          <div
                            key={d._id}
                            className="p-2 rounded-lg bg-zinc-950/70 border border-zinc-850 flex items-center justify-between text-xs"
                          >
                            <div>
                              <div className="text-zinc-200 font-medium">
                                {d.notes || (d.type === "TO_TAKE" ? "Lent money" : "Borrowed money")}
                              </div>
                              <div className="text-[10px] text-zinc-500">
                                {formatDate(d.date)} • {d.paymentMode}
                              </div>
                            </div>
                            <span
                              className={`font-mono font-bold ${
                                d.type === "TO_TAKE" ? "text-emerald-400" : "text-rose-400"
                              }`}
                            >
                              {d.type === "TO_TAKE" ? "+" : "-"}
                              {formatINR(d.amount)}
                            </span>
                          </div>
                        ))}
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
                <span>To Give (I Owe Others)</span>
              </div>
              <span className="text-xs font-black font-mono text-rose-400">
                -{formatINR(totalToGive)}
              </span>
            </div>

            {toGiveFriends.length === 0 ? (
              <div className="p-8 text-center rounded-2xl bg-zinc-900/40 border border-zinc-850">
                <p className="text-xs text-zinc-500">You don't owe any money to friends 👏</p>
              </div>
            ) : (
              toGiveFriends.map((f) => {
                const friendDues = dues.filter(
                  (d) => d.friendId?._id === f._id || (d.friendId as any) === f._id
                );
                const isExpanded = expandedFriendId === f._id;

                return (
                  <div
                    key={f._id}
                    className="p-5 rounded-2xl bg-zinc-900/60 border border-rose-500/20 hover:border-rose-500/40 transition-all shadow-lg"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-base font-bold text-zinc-100">{f.name}</h3>
                          {f.phone && (
                            <span className="text-[11px] text-zinc-500 flex items-center gap-1">
                              <Phone className="w-3 h-3" />
                              {f.phone}
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-rose-400 font-semibold mt-1">
                          You owe: -{formatINR(Math.abs(f.netBalance))}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setSettleFriend(f)}
                          className="px-3 py-1.5 rounded-xl bg-rose-500 hover:bg-rose-400 text-zinc-950 text-xs font-bold transition-all shadow-[0_0_12px_rgba(244,63,94,0.3)] active:scale-95"
                        >
                          Settle Up
                        </button>
                        <button
                          onClick={() => openAddDueForFriend(f._id)}
                          className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300"
                          title="Add entry for this friend"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Breakdown Toggle */}
                    <button
                      onClick={() => setExpandedFriendId(isExpanded ? null : f._id)}
                      className="mt-3 w-full pt-2 border-t border-zinc-800/80 flex items-center justify-between text-[11px] text-zinc-400 hover:text-zinc-200"
                    >
                      <span>
                        {f.unsettledCount} unsettled entr{f.unsettledCount > 1 ? "ies" : "y"}
                      </span>
                      {isExpanded ? (
                        <ChevronUp className="w-3.5 h-3.5" />
                      ) : (
                        <ChevronDown className="w-3.5 h-3.5" />
                      )}
                    </button>

                    {/* Detailed List */}
                    {isExpanded && (
                      <div className="mt-2 space-y-1.5 pt-2 border-t border-zinc-855">
                        {friendDues.map((d) => (
                          <div
                            key={d._id}
                            className="p-2 rounded-lg bg-zinc-950/70 border border-zinc-850 flex items-center justify-between text-xs"
                          >
                            <div>
                              <div className="text-zinc-200 font-medium">
                                {d.notes || (d.type === "TO_TAKE" ? "Lent money" : "Borrowed money")}
                              </div>
                              <div className="text-[10px] text-zinc-500">
                                {formatDate(d.date)} • {d.paymentMode}
                              </div>
                            </div>
                            <span
                              className={`font-mono font-bold ${
                                d.type === "TO_TAKE" ? "text-emerald-400" : "text-rose-400"
                              }`}
                            >
                              {d.type === "TO_TAKE" ? "+" : "-"}
                              {formatINR(d.amount)}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      ) : (
        /* Settled History Tab */
        <div className="rounded-2xl bg-zinc-900/60 border border-zinc-800/80 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-zinc-300">Settled Dues History</h3>
            <span className="text-xs text-zinc-500">{dues.length} records</span>
          </div>

          {dues.length === 0 ? (
            <div className="py-12 text-center text-zinc-500 text-xs">
              No settled dues found in history.
            </div>
          ) : (
            <div className="divide-y divide-zinc-850">
              {dues.map((item) => (
                <div key={item._id} className="py-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-zinc-800 text-emerald-400">
                      <CheckCircle className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-zinc-200">
                        {item.friendId?.name || "Friend"}
                      </div>
                      <div className="text-xs text-zinc-500">
                        {item.notes || "Settled entry"} • {formatDate(item.date)}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-mono text-zinc-400 line-through">
                      {formatINR(item.amount)}
                    </span>
                    <div className="text-[10px] text-emerald-400 font-medium">Settled</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Quick Due Modal */}
      <QuickDueModal
        isOpen={quickDueOpen}
        preselectedFriendId={preselectedFriendId}
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

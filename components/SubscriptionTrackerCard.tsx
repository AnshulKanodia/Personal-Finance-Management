"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Calendar,
  Plus,
  CheckCircle2,
  AlertCircle,
  Clock,
  Trash2,
  Edit2,
  Sparkles,
  ChevronRight,
  CreditCard,
  Check,
} from "lucide-react";
import { formatINR } from "@/lib/utils";
import { CategoryIcon } from "./CategoryIcon";
import { AddSubscriptionModal } from "./AddSubscriptionModal";
import { clearCache } from "@/lib/clientCache";

interface SubscriptionItem {
  _id: string;
  name: string;
  amount: number;
  billingCycle: "MONTHLY" | "QUARTERLY" | "YEARLY";
  dueDay: number;
  category?: {
    _id: string;
    name: string;
    color: string;
    icon: string;
  };
  paymentMode: string;
  nextDueDate: string;
  lastPaidAt?: string;
  status: "OVERDUE" | "DUE_SOON" | "PAID_THIS_CYCLE" | "UPCOMING";
  daysRemaining: number;
  isPaidThisCycle: boolean;
  monthlyRate: number;
  notes?: string;
}

export const SubscriptionTrackerCard: React.FC = () => {
  const [subscriptions, setSubscriptions] = useState<SubscriptionItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [meta, setMeta] = useState<{
    totalMonthlyCommitment: number;
    activeCount: number;
    dueSoonCount: number;
    overdueCount: number;
  }>({
    totalMonthlyCommitment: 0,
    activeCount: 0,
    dueSoonCount: 0,
    overdueCount: 0,
  });

  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [editingSub, setEditingSub] = useState<SubscriptionItem | null>(null);
  const [payingId, setPayingId] = useState<string | null>(null);

  const fetchSubscriptions = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/subscriptions");
      const json = await res.json();
      if (json.success) {
        setSubscriptions(json.data || []);
        if (json.meta) setMeta(json.meta);
      }
    } catch (e) {
      console.error("Failed to load subscriptions", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSubscriptions();
    const handleUpdate = () => fetchSubscriptions();
    window.addEventListener("finance_data_updated", handleUpdate);
    return () => window.removeEventListener("finance_data_updated", handleUpdate);
  }, [fetchSubscriptions]);

  const handlePay = async (sub: SubscriptionItem) => {
    try {
      setPayingId(sub._id);
      const res = await fetch(`/api/subscriptions/${sub._id}/pay`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const json = await res.json();
      if (json.success) {
        clearCache();
        window.dispatchEvent(new CustomEvent("finance_data_updated"));
        await fetchSubscriptions();
      }
    } catch (e) {
      console.error("Failed to mark subscription as paid", e);
    } finally {
      setPayingId(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to remove this recurring commitment?")) return;
    try {
      const res = await fetch(`/api/subscriptions/${id}`, { method: "DELETE" });
      const json = await res.json();
      if (json.success) {
        await fetchSubscriptions();
      }
    } catch (e) {
      console.error("Failed to delete subscription", e);
    }
  };

  const formatDueDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="rounded-2xl bg-zinc-900/60 backdrop-blur-md border border-zinc-800/80 p-4 sm:p-5 shadow-lg space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shadow-[0_0_12px_rgba(99,102,241,0.2)]">
            <Calendar className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-zinc-100 flex items-center gap-2">
              <span>Subscriptions & Recurring Bills</span>
              {meta.activeCount > 0 && (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-300 border border-zinc-700">
                  {meta.activeCount} active
                </span>
              )}
            </h3>
            <p className="text-[11px] text-zinc-400">
              Track fixed commitments & 1-tap mark as paid
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          {meta.totalMonthlyCommitment > 0 && (
            <div className="px-2.5 py-1 rounded-xl bg-zinc-950/80 border border-zinc-800 text-right">
              <span className="text-[10px] text-zinc-500 uppercase tracking-wider block">
                Monthly Burn
              </span>
              <span className="text-xs font-black font-mono text-indigo-400">
                {formatINR(meta.totalMonthlyCommitment)}/mo
              </span>
            </div>
          )}
          <button
            onClick={() => {
              setEditingSub(null);
              setModalOpen(true);
            }}
            className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs flex items-center gap-1 shadow-[0_0_12px_rgba(99,102,241,0.25)] transition-all active:scale-95 shrink-0"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Add Bill</span>
          </button>
        </div>
      </div>

      {/* Alert banner if bills overdue or due soon */}
      {(meta.overdueCount > 0 || meta.dueSoonCount > 0) && (
        <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between text-xs animate-in fade-in">
          <div className="flex items-center gap-2 text-amber-400 font-semibold text-[11px]">
            <AlertCircle className="w-4 h-4 shrink-0 text-amber-400" />
            <span>
              {meta.overdueCount > 0 && `${meta.overdueCount} bill(s) overdue! `}
              {meta.dueSoonCount > 0 && `${meta.dueSoonCount} bill(s) due within 3 days.`}
            </span>
          </div>
          <span className="text-[10px] text-amber-300 font-medium">Action Needed</span>
        </div>
      )}

      {/* Subscription List */}
      {loading && subscriptions.length === 0 ? (
        <div className="py-6 text-center text-xs text-zinc-500">
          Loading commitments...
        </div>
      ) : subscriptions.length === 0 ? (
        <div className="p-6 rounded-xl bg-zinc-950/50 border border-zinc-850 text-center">
          <Clock className="w-6 h-6 text-zinc-600 mx-auto mb-1.5" />
          <p className="text-xs text-zinc-400 font-medium">No recurring subscriptions yet</p>
          <p className="text-[11px] text-zinc-500 mt-0.5">
            Add your Netflix, Rent, Broadband, or SIP commitments to get smart renewal alerts.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
          {subscriptions.map((sub) => {
            const isPaying = payingId === sub._id;
            const isOverdue = sub.status === "OVERDUE";
            const isDueSoon = sub.status === "DUE_SOON";
            const isPaid = sub.status === "PAID_THIS_CYCLE";

            return (
              <div
                key={sub._id}
                className={`p-3 rounded-xl border transition-all flex flex-col justify-between gap-2.5 ${
                  isOverdue
                    ? "bg-rose-500/5 border-rose-500/30"
                    : isDueSoon
                    ? "bg-amber-500/5 border-amber-500/30"
                    : isPaid
                    ? "bg-emerald-500/5 border-emerald-500/20"
                    : "bg-zinc-950/60 border-zinc-850 hover:border-zinc-750"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2.5 min-w-0">
                    {sub.category ? (
                      <div
                        className="p-2 rounded-lg shrink-0 mt-0.5"
                        style={{
                          backgroundColor: `${sub.category.color}15`,
                          color: sub.category.color,
                        }}
                      >
                        <CategoryIcon name={sub.category.icon} className="w-4 h-4" />
                      </div>
                    ) : (
                      <div className="p-2 rounded-lg bg-zinc-800 text-zinc-400 shrink-0 mt-0.5">
                        <CreditCard className="w-4 h-4" />
                      </div>
                    )}
                    <div className="min-w-0">
                      <div className="font-bold text-xs text-zinc-100 truncate flex items-center gap-1.5">
                        <span>{sub.name}</span>
                        <span className="text-[9px] font-mono uppercase px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 border border-zinc-700">
                          {sub.billingCycle === "MONTHLY"
                            ? "Mo"
                            : sub.billingCycle === "QUARTERLY"
                            ? "Qtr"
                            : "Yr"}
                        </span>
                      </div>
                      <div className="text-[11px] text-zinc-400 mt-0.5 flex items-center gap-1.5 flex-wrap font-mono">
                        <span>Due: {formatDueDate(sub.nextDueDate)}</span>
                        <span>•</span>
                        <span>{sub.paymentMode}</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="text-sm font-extrabold font-mono text-zinc-100">
                      {formatINR(sub.amount)}
                    </div>
                    {sub.billingCycle !== "MONTHLY" && (
                      <span className="text-[10px] text-zinc-500 font-mono block">
                        ({formatINR(sub.monthlyRate)}/mo)
                      </span>
                    )}
                  </div>
                </div>

                {/* Status Badges & 1-Tap Action Bar */}
                <div className="pt-2 border-t border-zinc-800/60 flex items-center justify-between gap-2 text-[11px]">
                  <div>
                    {isOverdue && (
                      <span className="px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-400 font-bold border border-rose-500/20 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        <span>Overdue ({Math.abs(sub.daysRemaining)}d ago)</span>
                      </span>
                    )}
                    {isDueSoon && (
                      <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 font-bold border border-amber-500/20 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span>
                          {sub.daysRemaining === 0 ? "Due Today" : `Due in ${sub.daysRemaining}d`}
                        </span>
                      </span>
                    )}
                    {isPaid && (
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 font-bold border border-emerald-500/20 flex items-center gap-1">
                        <Check className="w-3 h-3" />
                        <span>Paid this cycle</span>
                      </span>
                    )}
                    {!isOverdue && !isDueSoon && !isPaid && (
                      <span className="text-zinc-500 font-mono">
                        In {sub.daysRemaining} days
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {!isPaid ? (
                      <button
                        onClick={() => handlePay(sub)}
                        disabled={isPaying}
                        className="px-2.5 py-1 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-[10px] shadow-[0_0_10px_rgba(16,185,129,0.25)] transition-all active:scale-95 flex items-center gap-1"
                      >
                        {isPaying ? (
                          <span>Logging...</span>
                        ) : (
                          <>
                            <CheckCircle2 className="w-3 h-3 stroke-[2.5]" />
                            <span>Mark as Paid</span>
                          </>
                        )}
                      </button>
                    ) : (
                      <span className="text-[10px] text-zinc-500 font-mono">Recorded</span>
                    )}

                    <button
                      onClick={() => {
                        setEditingSub(sub);
                        setModalOpen(true);
                      }}
                      className="p-1 text-zinc-500 hover:text-zinc-300 rounded hover:bg-zinc-800"
                      title="Edit"
                    >
                      <Edit2 className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => handleDelete(sub._id)}
                      className="p-1 text-zinc-500 hover:text-rose-400 rounded hover:bg-rose-500/10"
                      title="Delete"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Subscription Modal */}
      <AddSubscriptionModal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditingSub(null);
        }}
        onSuccess={() => {
          fetchSubscriptions();
        }}
        subscriptionToEdit={editingSub}
      />
    </div>
  );
};

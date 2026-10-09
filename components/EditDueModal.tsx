"use client";

import React, { useState, useEffect } from "react";
import { X, Trash2, Calendar, Check, ArrowUpRight, ArrowDownLeft, Users } from "lucide-react";
import { formatINR } from "@/lib/utils";
import { clearCache } from "@/lib/clientCache";

interface Friend {
  _id: string;
  name: string;
  phone?: string;
  netBalance?: number;
}

interface DueItem {
  _id: string;
  amount: number;
  type: "TO_GIVE" | "TO_TAKE";
  paymentMode: "UPI" | "CASH" | string;
  notes?: string;
  date: string;
  isSettled?: boolean;
  friendId?: {
    _id: string;
    name: string;
    phone?: string;
  } | string;
}

interface EditDueModalProps {
  isOpen: boolean;
  due: DueItem | null;
  friends?: Friend[];
  onClose: () => void;
  onSuccess: () => void;
}

export const EditDueModal: React.FC<EditDueModalProps> = ({
  isOpen,
  due,
  friends = [],
  onClose,
  onSuccess,
}) => {
  const [type, setType] = useState<"TO_GIVE" | "TO_TAKE">("TO_TAKE");
  const [amount, setAmount] = useState<string>("");
  const [paymentMode, setPaymentMode] = useState<"UPI" | "CASH">("UPI");
  const [friendId, setFriendId] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [date, setDate] = useState<string>("");
  const [isSettled, setIsSettled] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [deleting, setDeleting] = useState<boolean>(false);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    if (isOpen && due) {
      setType(due.type);
      setAmount(due.amount.toString());
      setPaymentMode((due.paymentMode as "UPI" | "CASH") || "UPI");
      setNotes(due.notes || "");
      setDate(
        due.date
          ? new Date(due.date).toISOString().split("T")[0]
          : new Date().toISOString().split("T")[0]
      );
      setIsSettled(Boolean(due.isSettled));

      const fId = typeof due.friendId === "object" ? due.friendId?._id : due.friendId;
      setFriendId(fId || "");
      setError("");
    }
  }, [isOpen, due]);

  if (!isOpen || !due) return null;

  const currentFriendName =
    typeof due.friendId === "object"
      ? due.friendId?.name
      : friends.find((f) => f._id === friendId)?.name || "Friend";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const numericAmount = parseFloat(amount);
    if (!numericAmount || numericAmount <= 0) {
      setError("Please enter a valid amount greater than zero");
      return;
    }

    if (!friendId) {
      setError("Please select a valid friend");
      return;
    }

    try {
      setLoading(true);
      const res = await fetch(`/api/dues/${due._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: numericAmount,
          type,
          paymentMode,
          friendId,
          notes: notes.trim(),
          date,
          isSettled,
        }),
      });

      const json = await res.json();
      if (!json.success) {
        setError(json.message || "Failed to update entry");
        return;
      }

      clearCache();
      window.dispatchEvent(new CustomEvent("finance_data_updated"));
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || "An error occurred while updating");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to permanently delete this Khaata entry?")) {
      return;
    }

    try {
      setDeleting(true);
      const res = await fetch(`/api/dues/${due._id}`, {
        method: "DELETE",
      });

      const json = await res.json();
      if (!json.success) {
        setError(json.message || "Failed to delete entry");
        return;
      }

      clearCache();
      window.dispatchEvent(new CustomEvent("finance_data_updated"));
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || "An error occurred while deleting");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-2xl bg-zinc-950 border border-zinc-800 shadow-2xl overflow-hidden max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-zinc-850 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-base font-bold text-zinc-100">Edit Khaata Entry</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-300 font-mono">
              {currentFriendName}
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/80 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 overflow-y-auto space-y-5">
          {error && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-medium">
              {error}
            </div>
          )}

          {/* Type Toggle: TO_GIVE vs TO_TAKE */}
          <div className="grid grid-cols-2 gap-2 p-1 bg-zinc-900 rounded-xl border border-zinc-800">
            <button
              type="button"
              onClick={() => setType("TO_GIVE")}
              className={`py-2.5 px-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                type === "TO_GIVE"
                  ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 shadow-[0_0_15px_rgba(16,185,129,0.2)]"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              <ArrowDownLeft className="w-3.5 h-3.5 text-emerald-400" />
              <span>Friend Paid Me (+ Deposit)</span>
            </button>
            <button
              type="button"
              onClick={() => setType("TO_TAKE")}
              className={`py-2.5 px-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                type === "TO_TAKE"
                  ? "bg-rose-500/20 text-rose-400 border border-rose-500/40 shadow-[0_0_15px_rgba(244,63,94,0.2)]"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              <ArrowUpRight className="w-3.5 h-3.5 text-rose-400" />
              <span>I Paid / Spent (- Lent)</span>
            </button>
          </div>

          {/* Amount Input */}
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5">
              Amount
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl font-bold text-zinc-400">
                ₹
              </span>
              <input
                type="number"
                step="any"
                placeholder="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                autoFocus
                className={`w-full pl-10 pr-4 py-3 bg-zinc-900/80 border rounded-xl text-2xl font-extrabold focus:outline-none focus:ring-2 transition-all ${
                  type === "TO_GIVE"
                    ? "border-emerald-500/30 focus:border-emerald-500 focus:ring-emerald-500/20 text-emerald-400"
                    : "border-rose-500/30 focus:border-rose-500 focus:ring-rose-500/20 text-rose-400"
                }`}
              />
            </div>
          </div>

          {/* Friend Selector */}
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5">
              Friend Contact
            </label>
            <div className="relative">
              <select
                value={friendId}
                onChange={(e) => setFriendId(e.target.value)}
                className="w-full px-3 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-zinc-200 focus:outline-none focus:border-emerald-500"
              >
                {friends.length === 0 && (
                  <option value={friendId}>{currentFriendName}</option>
                )}
                {friends.map((f) => (
                  <option key={f._id} value={f._id}>
                    {f.name} {f.phone ? `(${f.phone})` : ""}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Payment Mode */}
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5">
              Payment Mode
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setPaymentMode("UPI")}
                className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-all text-center ${
                  paymentMode === "UPI"
                    ? "text-sky-400 border-sky-500/40 bg-sky-500/10 shadow-[0_0_12px_rgba(14,165,233,0.2)]"
                    : "border-zinc-800 bg-zinc-900/60 text-zinc-400 hover:border-zinc-700"
                }`}
              >
                UPI Transfer
              </button>
              <button
                type="button"
                onClick={() => setPaymentMode("CASH")}
                className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-all text-center ${
                  paymentMode === "CASH"
                    ? "text-amber-400 border-amber-500/40 bg-amber-500/10 shadow-[0_0_12px_rgba(245,158,11,0.2)]"
                    : "border-zinc-800 bg-zinc-900/60 text-zinc-400 hover:border-zinc-700"
                }`}
              >
                Cash
              </button>
            </div>
          </div>

          {/* Date & Notes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1">
                Date
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-zinc-200 focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1">
                Reason / Note
              </label>
              <input
                type="text"
                placeholder="e.g. Dinner, Uber, Tea..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-zinc-200 focus:outline-none focus:border-emerald-500 placeholder:text-zinc-600"
              />
            </div>
          </div>

          {/* Settled Status Toggle */}
          <div className="pt-1">
            <label className="flex items-center gap-2 cursor-pointer p-2.5 rounded-xl bg-zinc-900/60 border border-zinc-800">
              <input
                type="checkbox"
                checked={isSettled}
                onChange={(e) => setIsSettled(e.target.checked)}
                className="w-4 h-4 rounded text-emerald-500 bg-zinc-950 border-zinc-700 focus:ring-0 focus:ring-offset-0"
              />
              <div className="text-xs">
                <span className="font-semibold text-zinc-200">Mark as Settled</span>
                <span className="text-zinc-500 block text-[11px]">
                  Archived to settled passbook history
                </span>
              </div>
            </label>
          </div>

          {/* Action Buttons: Delete and Save */}
          <div className="flex items-center gap-2 pt-2">
            <button
              type="button"
              onClick={handleDelete}
              disabled={deleting || loading}
              className="p-3 rounded-xl border border-rose-500/30 text-rose-400 hover:bg-rose-500/10 hover:border-rose-500/50 transition-all flex items-center justify-center disabled:opacity-50"
              title="Delete entry"
            >
              <Trash2 className="w-5 h-5" />
            </button>

            <button
              type="submit"
              disabled={loading || deleting}
              className={`flex-1 py-3 rounded-xl font-bold text-sm text-zinc-950 transition-all flex items-center justify-center gap-2 active:scale-98 ${
                type === "TO_GIVE"
                  ? "bg-gradient-to-r from-emerald-500 to-emerald-400 hover:from-emerald-400 hover:to-emerald-300 shadow-[0_0_20px_rgba(16,185,129,0.3)]"
                  : "bg-gradient-to-r from-rose-500 to-rose-400 hover:from-rose-400 hover:to-rose-300 shadow-[0_0_20px_rgba(244,63,94,0.3)]"
              } disabled:opacity-50`}
            >
              {loading ? (
                <span>Saving Changes...</span>
              ) : (
                <>
                  <Check className="w-4 h-4 stroke-[3]" />
                  <span>Update Entry</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

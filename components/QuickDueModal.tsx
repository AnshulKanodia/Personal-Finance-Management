"use client";

import React, { useState, useEffect } from "react";
import { X, Check, UserPlus, IndianRupee, ArrowUpRight, ArrowDownLeft } from "lucide-react";
import { formatINR } from "@/lib/utils";

interface Friend {
  _id: string;
  name: string;
  phone?: string;
  netBalance?: number;
}

interface QuickDueModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialType?: "TO_TAKE" | "TO_GIVE";
  preselectedFriendId?: string;
}

export const QuickDueModal: React.FC<QuickDueModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialType = "TO_TAKE",
  preselectedFriendId,
}) => {
  const [type, setType] = useState<"TO_TAKE" | "TO_GIVE">(initialType);
  const [amount, setAmount] = useState<string>("");
  const [paymentMode, setPaymentMode] = useState<"UPI" | "CASH">("UPI");
  const [friendId, setFriendId] = useState<string>(preselectedFriendId || "");
  const [friends, setFriends] = useState<Friend[]>([]);
  const [isCreatingFriend, setIsCreatingFriend] = useState<boolean>(false);
  const [newFriendName, setNewFriendName] = useState<string>("");
  const [newFriendPhone, setNewFriendPhone] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [date, setDate] = useState<string>(new Date().toISOString().split("T")[0]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    if (isOpen) {
      setType(initialType);
      if (preselectedFriendId) {
        setFriendId(preselectedFriendId);
      }
      fetchFriends();
    }
  }, [isOpen, initialType, preselectedFriendId]);

  const fetchFriends = async () => {
    try {
      const res = await fetch("/api/friends");
      const json = await res.json();
      if (json.success) {
        setFriends(json.data);
        if (!friendId && !preselectedFriendId && json.data.length > 0) {
          setFriendId(json.data[0]._id);
        }
      }
    } catch (e) {
      console.error("Failed to load friends", e);
    }
  };

  const selectedFriend = friends.find((f) => f._id === friendId);
  const currentNet = selectedFriend?.netBalance ?? 0;
  const numAmount = parseFloat(amount) || 0;
  // If friend paid me (TO_GIVE), it reduces what they owe (or increases what I owe): currentNet - numAmount
  // If I paid (TO_TAKE), it increases what they owe: currentNet + numAmount
  const newEstimatedNet = type === "TO_GIVE" ? currentNet - numAmount : currentNet + numAmount;

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const numericAmount = parseFloat(amount);
    if (!numericAmount || numericAmount <= 0) {
      setError("Please enter a valid amount");
      return;
    }

    let targetFriendId = friendId;

    try {
      setLoading(true);

      // If user is typing a new friend inline
      if (isCreatingFriend) {
        if (!newFriendName.trim()) {
          setError("Friend name is required");
          setLoading(false);
          return;
        }

        const friendRes = await fetch("/api/friends", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: newFriendName, phone: newFriendPhone }),
        });
        const friendJson = await friendRes.json();
        if (!friendJson.success) {
          setError(friendJson.message || "Failed to create friend");
          setLoading(false);
          return;
        }
        targetFriendId = friendJson.data._id;
      }

      if (!targetFriendId) {
        setError("Please select or add a friend");
        setLoading(false);
        return;
      }

      const res = await fetch("/api/dues", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          friendId: targetFriendId,
          amount: numericAmount,
          type,
          paymentMode,
          notes,
          date,
        }),
      });

      const json = await res.json();
      if (!json.success) {
        setError(json.message || "Failed to add ledger entry");
        return;
      }

      setAmount("");
      setNotes("");
      setIsCreatingFriend(false);
      setNewFriendName("");
      setNewFriendPhone("");
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-2xl bg-zinc-950 border border-zinc-800 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-zinc-850 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-base font-bold text-zinc-100">Khaata Entry</span>
            <span className="text-xs text-zinc-400 font-mono">Split & Dues</span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/80 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 overflow-y-auto space-y-5">
          {error && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-medium">
              {error}
            </div>
          )}

          {/* Type Toggle: TO_GIVE (Friend paid / deposited) vs TO_TAKE (I paid / split) */}
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
              Amount (INR)
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

            {/* Live Net Balance Adjustment Preview */}
            {selectedFriend && numAmount > 0 && (
              <div className="mt-2.5 p-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs">
                <div className="flex items-center justify-between text-zinc-400 text-[11px]">
                  <span>Current Balance with {selectedFriend.name}:</span>
                  <span className={currentNet >= 0 ? "text-emerald-400 font-semibold" : "text-rose-400 font-semibold"}>
                    {currentNet >= 0 ? `+${formatINR(currentNet)} (owes you)` : `-${formatINR(Math.abs(currentNet))} (you owe)`}
                  </span>
                </div>
                <div className="flex items-center justify-between font-bold mt-1.5 pt-1.5 border-t border-zinc-800/60">
                  <span className="text-zinc-200">Adjusted Net Balance:</span>
                  <span className={newEstimatedNet >= 0 ? "text-emerald-400 font-mono text-sm" : "text-rose-400 font-mono text-sm"}>
                    {newEstimatedNet > 0 && `+${formatINR(newEstimatedNet)} (${selectedFriend.name} will owe you)`}
                    {newEstimatedNet < 0 && `-${formatINR(Math.abs(newEstimatedNet))} (You will owe ${selectedFriend.name})`}
                    {newEstimatedNet === 0 && `₹0 (All Squared Off!)`}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Friend Selection or Create Friend */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-medium text-zinc-400">Friend</label>
              <button
                type="button"
                onClick={() => setIsCreatingFriend(!isCreatingFriend)}
                className="text-xs text-sky-400 hover:text-sky-300 flex items-center gap-1 font-medium"
              >
                <UserPlus className="w-3.5 h-3.5" />
                {isCreatingFriend ? "Select existing" : "+ Add new friend"}
              </button>
            </div>

            {isCreatingFriend ? (
              <div className="p-3 bg-zinc-900/80 border border-zinc-800 rounded-xl space-y-2">
                <input
                  type="text"
                  placeholder="Friend's Full Name"
                  value={newFriendName}
                  onChange={(e) => setNewFriendName(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-xs text-zinc-200 focus:outline-none focus:border-sky-500"
                />
                <input
                  type="text"
                  placeholder="Phone (optional, for UPI)"
                  value={newFriendPhone}
                  onChange={(e) => setNewFriendPhone(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-xs text-zinc-200 focus:outline-none focus:border-sky-500"
                />
              </div>
            ) : (
              <select
                value={friendId}
                onChange={(e) => setFriendId(e.target.value)}
                className="w-full px-3 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-zinc-200 focus:outline-none focus:border-emerald-500"
              >
                {friends.length === 0 && <option value="">No friends added yet</option>}
                {friends.map((f) => (
                  <option key={f._id} value={f._id}>
                    {f.name} {f.phone ? `(${f.phone})` : ""}
                  </option>
                ))}
              </select>
            )}
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

          {/* Reason / Notes & Date */}
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
                placeholder="e.g. Swiggy split, Cab, Chai..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-zinc-200 focus:outline-none focus:border-emerald-500 placeholder:text-zinc-600"
              />
            </div>
          </div>

          {/* Submit */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3 rounded-xl font-bold text-sm text-zinc-950 transition-all flex items-center justify-center gap-2 active:scale-98 ${
                type === "TO_GIVE"
                  ? "bg-gradient-to-r from-emerald-500 to-emerald-400 hover:from-emerald-400 hover:to-emerald-300 shadow-[0_0_20px_rgba(16,185,129,0.3)]"
                  : "bg-gradient-to-r from-rose-500 to-rose-400 hover:from-rose-400 hover:to-rose-300 shadow-[0_0_20px_rgba(244,63,94,0.3)]"
              }`}
            >
              {loading ? (
                <span>Recording entry...</span>
              ) : (
                <>
                  <Check className="w-4 h-4 stroke-[3]" />
                  <span>
                    Record {type === "TO_GIVE" ? "Payment Received (+)" : "Expense / Split (-)"}
                  </span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

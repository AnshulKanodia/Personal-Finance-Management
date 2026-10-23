"use client";

import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { X, Check, User, Phone, AtSign, FileText, Trash2, AlertCircle } from "lucide-react";
import { formatINR } from "@/lib/utils";
import { clearCache } from "@/lib/clientCache";

export interface FriendDetails {
  _id: string;
  name: string;
  phone?: string;
  upiId?: string;
  notes?: string;
  toGive?: number;
  toTake?: number;
  netBalance?: number;
  unsettledCount?: number;
}

interface EditFriendModalProps {
  isOpen: boolean;
  friend: FriendDetails | null;
  onClose: () => void;
  onSuccess: () => void;
}

export const EditFriendModal: React.FC<EditFriendModalProps> = ({
  isOpen,
  friend,
  onClose,
  onSuccess,
}) => {
  const [name, setName] = useState<string>("");
  const [phone, setPhone] = useState<string>("");
  const [upiId, setUpiId] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [deleting, setDeleting] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [mounted, setMounted] = useState<boolean>(false);
  const nameInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen && friend) {
      setName(friend.name || "");
      setPhone(friend.phone || "");
      setUpiId(friend.upiId || "");
      setNotes(friend.notes || "");
      setError("");

      const timer = setTimeout(() => {
        nameInputRef.current?.focus();
      }, 60);
      return () => clearTimeout(timer);
    }
  }, [isOpen, friend]);

  if (!isOpen || !friend || !mounted) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const trimmedName = name.trim();
    if (!trimmedName) {
      setError("Friend name cannot be empty");
      return;
    }

    try {
      setLoading(true);
      const res = await fetch(`/api/friends/${friend._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: trimmedName,
          phone: phone.trim(),
          upiId: upiId.trim(),
          notes: notes.trim(),
        }),
      });

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.message || "Failed to update friend details");
      }

      clearCache();
      window.dispatchEvent(new CustomEvent("finance_data_updated"));
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    const unsettled = friend.unsettledCount || 0;
    const confirmMessage =
      unsettled > 0
        ? `Are you sure you want to delete ${friend.name}? This will permanently remove ${unsettled} pending due/split record(s).`
        : `Are you sure you want to remove ${friend.name} from your friends list?`;

    if (!window.confirm(confirmMessage)) return;

    try {
      setDeleting(true);
      setError("");
      const res = await fetch(`/api/friends/${friend._id}`, {
        method: "DELETE",
      });

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.message || "Failed to delete friend");
      }

      clearCache();
      window.dispatchEvent(new CustomEvent("finance_data_updated"));
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to delete friend");
    } finally {
      setDeleting(false);
    }
  };

  const net = friend.netBalance || 0;

  const modalContent = (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-black/85 animate-in fade-in duration-150">
      <div className="relative w-full max-w-md rounded-2xl bg-zinc-950 border border-zinc-850 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-zinc-850 flex items-center justify-between shrink-0 bg-zinc-950/80">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 font-bold text-xs">
              {friend.name[0]?.toUpperCase() || "F"}
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-zinc-100">Edit Friend Details</h3>
              <p className="text-[11px] text-zinc-400">Update name, contact info, or UPI ID</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-850 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-4 overflow-y-auto text-xs">
          {error && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-medium flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Current Balance Pill */}
          <div className="p-3 rounded-xl bg-zinc-900/70 border border-zinc-800 flex items-center justify-between">
            <span className="text-[11px] text-zinc-400 font-medium">Current Net Balance</span>
            <span
              className={`font-mono font-bold text-xs ${
                net > 0 ? "text-emerald-400" : net < 0 ? "text-rose-400" : "text-zinc-400"
              }`}
            >
              {net > 0
                ? `Owes you +${formatINR(net)}`
                : net < 0
                ? `You owe -${formatINR(Math.abs(net))}`
                : "All Settled (₹0)"}
            </span>
          </div>

          {/* Friend Name */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold text-zinc-300 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-zinc-500" />
              <span>Friend Name *</span>
            </label>
            <input
              ref={nameInputRef}
              type="text"
              placeholder="e.g. Rahul Sharma"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-zinc-100 focus:outline-none focus:border-emerald-500 transition-colors"
              required
            />
          </div>

          {/* Phone Number */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold text-zinc-300 flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-zinc-500" />
              <span>Phone / WhatsApp Number (Optional)</span>
            </label>
            <input
              type="tel"
              placeholder="e.g. +91 98765 43210"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full px-3 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-zinc-100 font-mono focus:outline-none focus:border-emerald-500 transition-colors"
            />
            <p className="text-[10px] text-zinc-500">Used for 1-tap WhatsApp ledger share and statement sending.</p>
          </div>

          {/* UPI ID */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold text-zinc-300 flex items-center gap-1.5">
              <AtSign className="w-3.5 h-3.5 text-zinc-500" />
              <span>UPI ID / VPA (Optional)</span>
            </label>
            <input
              type="text"
              placeholder="e.g. rahul@okaxis or 9876543210@paytm"
              value={upiId}
              onChange={(e) => setUpiId(e.target.value)}
              className="w-full px-3 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-zinc-100 font-mono focus:outline-none focus:border-emerald-500 transition-colors"
            />
            <p className="text-[10px] text-zinc-500">Helps auto-populate payment links when you owe them money.</p>
          </div>

          {/* Notes / Relationship */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold text-zinc-300 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-zinc-500" />
              <span>Notes / Tag (Optional)</span>
            </label>
            <input
              type="text"
              placeholder="e.g. Roommate, College buddy, Goa Trip"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-zinc-100 focus:outline-none focus:border-emerald-500 transition-colors"
            />
          </div>

          {/* Actions */}
          <div className="pt-2 flex items-center gap-2">
            <button
              type="button"
              onClick={handleDelete}
              disabled={deleting || loading}
              className="px-3 py-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs font-semibold flex items-center gap-1.5 transition-all active:scale-95 disabled:opacity-50"
              title="Delete friend contact"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>{deleting ? "Deleting..." : "Delete"}</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              disabled={loading || deleting}
              className="flex-1 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-xs font-semibold border border-zinc-800 transition-colors"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={loading || deleting}
              className="flex-1 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-xs flex items-center justify-center gap-1.5 shadow-[0_0_15px_rgba(16,185,129,0.25)] transition-all active:scale-95 disabled:opacity-50"
            >
              <Check className="w-4 h-4 stroke-[2.5]" />
              <span>{loading ? "Saving..." : "Save Details"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};

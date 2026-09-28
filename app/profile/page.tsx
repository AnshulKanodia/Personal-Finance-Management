"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  User,
  Tags,
  Users,
  Lock,
  Edit3,
  Trash2,
  Plus,
  ShieldCheck,
  Check,
  X,
  Phone,
  ArrowRight,
  LogOut,
  IndianRupee,
  Sparkles,
  Download,
} from "lucide-react";
import { formatINR } from "@/lib/utils";
import { clearCache } from "@/lib/clientCache";
import { DownloadStatementModal } from "@/components/DownloadStatementModal";

interface Friend {
  _id: string;
  name: string;
  phone?: string;
  netBalance: number;
}

export default function ProfilePage() {
  const router = useRouter();

  // User Profile State (persisted in localStorage)
  const [name, setName] = useState<string>("Anshul Kanodia");
  const [email, setEmail] = useState<string>("anshulkanodia3560@gmail.com");
  const [currency, setCurrency] = useState<string>("INR (₹)");

  // Modals / Editing state
  const [isEditingProfile, setIsEditingProfile] = useState<boolean>(false);
  const [editName, setEditName] = useState<string>("");
  const [editEmail, setEditEmail] = useState<string>("");

  // Friends State
  const [friends, setFriends] = useState<Friend[]>([]);
  const [loadingFriends, setLoadingFriends] = useState<boolean>(true);
  const [isAddFriendOpen, setIsAddFriendOpen] = useState<boolean>(false);
  const [newFriendName, setNewFriendName] = useState<string>("");
  const [newFriendPhone, setNewFriendPhone] = useState<string>("");
  const [submittingFriend, setSubmittingFriend] = useState<boolean>(false);
  const [friendError, setFriendError] = useState<string>("");
  const [statementOpen, setStatementOpen] = useState<boolean>(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedName = localStorage.getItem("rupeepulse_user_name");
      const savedEmail = localStorage.getItem("rupeepulse_user_email");
      if (savedName) setName(savedName);
      if (savedEmail) setEmail(savedEmail);
    }
    fetchFriends();
  }, []);

  const fetchFriends = async () => {
    try {
      setLoadingFriends(true);
      const res = await fetch("/api/friends");
      const json = await res.json();
      if (json.success) {
        setFriends(json.data);
      }
    } catch (e) {
      console.error("Failed to load friends", e);
    } finally {
      setLoadingFriends(false);
    }
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (editName.trim()) {
      setName(editName.trim());
      localStorage.setItem("rupeepulse_user_name", editName.trim());
    }
    if (editEmail.trim()) {
      setEmail(editEmail.trim());
      localStorage.setItem("rupeepulse_user_email", editEmail.trim());
    }
    setIsEditingProfile(false);
  };

  const handleOpenEditProfile = () => {
    setEditName(name);
    setEditEmail(email);
    setIsEditingProfile(true);
  };

  const handleAddFriend = async (e: React.FormEvent) => {
    e.preventDefault();
    setFriendError("");
    if (!newFriendName.trim()) {
      setFriendError("Friend name is required");
      return;
    }

    try {
      setSubmittingFriend(true);
      const res = await fetch("/api/friends", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newFriendName.trim(),
          phone: newFriendPhone.trim() || undefined,
        }),
      });

      const json = await res.json();
      if (!json.success) {
        setFriendError(json.message || "Failed to add friend");
        return;
      }

      clearCache();
      window.dispatchEvent(new CustomEvent("finance_data_updated"));
      setNewFriendName("");
      setNewFriendPhone("");
      setIsAddFriendOpen(false);
      fetchFriends();
    } catch (err: any) {
      setFriendError(err.message || "An error occurred");
    } finally {
      setSubmittingFriend(false);
    }
  };

  const handleDeleteFriend = async (friendId: string, friendName: string) => {
    if (!confirm(`Are you sure you want to remove ${friendName} and all their records?`)) {
      return;
    }
    try {
      const res = await fetch(`/api/friends/${friendId}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (json.success) {
        clearCache();
        window.dispatchEvent(new CustomEvent("finance_data_updated"));
        setFriends((prev) => prev.filter((f) => f._id !== friendId));
      } else {
        alert(json.message || "Failed to delete friend");
      }
    } catch (e) {
      console.error("Delete friend failed", e);
    }
  };

  const handleLockVault = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/login");
      router.refresh();
    } catch (e) {
      console.error("Lock error", e);
    }
  };

  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-in fade-in duration-300 pb-12">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-zinc-100">
          User Profile & Settings
        </h1>
        <p className="text-xs sm:text-sm text-zinc-400 mt-1">
          Manage your private vault credentials, categories, and friend contacts
        </p>
      </div>

      {/* Main Profile Card */}
      <div className="rounded-3xl glass-panel p-6 sm:p-7 border border-white/[0.08] relative overflow-hidden">
        <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-emerald-500/40 to-transparent" />

        <div className="flex flex-col sm:flex-row items-center sm:items-start justify-between gap-5 text-center sm:text-left">
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <div className="w-18 h-18 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-tr from-emerald-500 via-sky-500 to-indigo-500 p-0.5 shadow-[0_0_30px_rgba(16,185,129,0.3)] flex-shrink-0">
              <div className="w-full h-full bg-[#0a0a0f] rounded-[14px] flex items-center justify-center font-black text-2xl text-emerald-400">
                {initials}
              </div>
            </div>

            <div>
              <div className="flex items-center justify-center sm:justify-start gap-2">
                <h2 className="text-xl sm:text-2xl font-black text-zinc-100">{name}</h2>
                <span className="p-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                  <ShieldCheck className="w-3.5 h-3.5" />
                </span>
              </div>
              <p className="text-xs text-zinc-400 mt-0.5 font-mono">{email}</p>
              <div className="flex items-center justify-center sm:justify-start gap-2 mt-2">
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-semibold font-mono">
                  Vault Owner
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-300 font-mono">
                  {currency}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleOpenEditProfile}
              className="px-4 py-2 rounded-xl bg-zinc-850 hover:bg-zinc-800 border border-zinc-700/80 text-xs font-semibold text-zinc-200 transition-all flex items-center gap-1.5 active:scale-95 shadow-sm"
            >
              <Edit3 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Edit Profile</span>
            </button>

            <button
              onClick={handleLockVault}
              className="px-3.5 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-xs font-semibold text-rose-400 transition-all flex items-center gap-1.5 active:scale-95"
              title="Lock vault immediately"
            >
              <Lock className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Lock Vault</span>
            </button>
          </div>
        </div>
      </div>

      {/* Grid of Sections: Category Manager & Security */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Category Manager Option */}
        <Link
          href="/categories"
          className="p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800 hover:border-emerald-500/40 hover:bg-emerald-500/5 transition-all group flex items-start justify-between"
        >
          <div className="flex items-start gap-3.5">
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 group-hover:scale-105 transition-transform">
              <Tags className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-zinc-200 group-hover:text-emerald-300 transition-colors">
                Category Manager
              </h3>
              <p className="text-xs text-zinc-500 mt-1 leading-relaxed">
                Add, customize, and edit expenditure & income categories with custom colors and icons
              </p>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-zinc-600 group-hover:text-emerald-400 transition-colors flex-shrink-0 mt-1" />
        </Link>

        {/* Security & PIN Settings */}
        <div className="p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800 flex items-start justify-between">
          <div className="flex items-start gap-3.5">
            <div className="p-3 rounded-xl bg-sky-500/10 border border-sky-500/30 text-sky-400">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-zinc-200">Vault Security</h3>
              <p className="text-xs text-zinc-500 mt-1 leading-relaxed">
                Protected by 6-digit numeric PIN. Vault automatically locks on every page reload.
              </p>
              <div className="mt-2 text-[11px] text-zinc-400 font-mono">
                Status: <span className="text-emerald-400 font-bold">Encrypted & Active</span>
              </div>
            </div>
          </div>
        </div>

        {/* Download Statement Option */}
        <button
          onClick={() => setStatementOpen(true)}
          className="p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800 hover:border-emerald-500/40 hover:bg-emerald-500/5 transition-all group flex items-start justify-between text-left sm:col-span-2 shadow-sm"
        >
          <div className="flex items-start gap-3.5">
            <div className="p-3 rounded-xl bg-gradient-to-tr from-emerald-500/20 to-sky-500/20 border border-emerald-500/30 text-emerald-400 group-hover:scale-105 transition-transform">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-zinc-200 group-hover:text-emerald-300 transition-colors">
                  Download Financial Statement
                </h3>
                <span className="text-[10px] px-2 py-0.2 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono">
                  PDF / Excel / CSV
                </span>
              </div>
              <p className="text-xs text-zinc-500 mt-1 leading-relaxed">
                Export formal statements for tax, auditing, or record-keeping by month, week, day, year, or custom dates
              </p>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-zinc-600 group-hover:text-emerald-400 transition-colors flex-shrink-0 mt-1" />
        </button>
      </div>

      {/* Manage Friends Section */}
      <div className="rounded-3xl bg-zinc-900/60 border border-zinc-800/80 p-5 sm:p-6 backdrop-blur-md">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-emerald-400" />
              <h3 className="text-sm font-bold text-zinc-200 uppercase tracking-wider">
                Manage Friends ({friends.length})
              </h3>
            </div>
            <p className="text-xs text-zinc-500 mt-0.5">
              Add contacts for the continuous passbook ledger and track who owes what
            </p>
          </div>

          <button
            onClick={() => setIsAddFriendOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 font-semibold text-xs transition-all active:scale-95"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Add Friend</span>
          </button>
        </div>

        {loadingFriends ? (
          <div className="py-8 text-center text-xs text-zinc-500">Loading friend records...</div>
        ) : friends.length === 0 ? (
          <div className="py-8 text-center text-xs text-zinc-500">
            No friends added yet. Click &quot;Add Friend&quot; to begin tracking split dues.
          </div>
        ) : (
          <div className="divide-y divide-zinc-800/60">
            {friends.map((friend) => (
              <div
                key={friend._id}
                className="py-3 flex items-center justify-between hover:bg-zinc-900/30 px-2 rounded-xl transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-zinc-800 border border-zinc-700/80 flex items-center justify-center font-bold text-xs text-zinc-300">
                    {friend.name[0]?.toUpperCase() || "F"}
                  </div>
                  <div>
                    <div className="text-xs sm:text-sm font-bold text-zinc-200">
                      {friend.name}
                    </div>
                    {friend.phone && (
                      <div className="flex items-center gap-1 text-[11px] text-zinc-500 font-mono">
                        <Phone className="w-3 h-3 text-zinc-600" />
                        <span>{friend.phone}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <span
                      className={`text-xs font-mono font-bold ${
                        friend.netBalance > 0
                          ? "text-emerald-400"
                          : friend.netBalance < 0
                          ? "text-rose-400"
                          : "text-zinc-500"
                      }`}
                    >
                      {friend.netBalance > 0
                        ? `+${formatINR(friend.netBalance)}`
                        : friend.netBalance < 0
                        ? `-${formatINR(Math.abs(friend.netBalance))}`
                        : "Settled"}
                    </span>
                  </div>

                  <button
                    onClick={() => handleDeleteFriend(friend._id, friend.name)}
                    className="p-1.5 rounded-lg text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                    title={`Remove ${friend.name}`}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Version Number at Bottom */}
      <div className="pt-6 border-t border-zinc-850 flex flex-col sm:flex-row items-center justify-between gap-2 text-center text-xs text-zinc-500">
        <div>
          <span className="font-semibold text-zinc-400">RupeePulse PWA</span> • Version 1.2.0 (Build 2026.09)
        </div>
        <div className="flex items-center gap-2 text-[11px] font-mono text-zinc-600">
          <span>Tailored for Indian Currency (INR)</span>
          <span>•</span>
          <span>Single-User Private Edition</span>
        </div>
      </div>

      {/* Edit Profile Modal */}
      {isEditingProfile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-md rounded-2xl bg-zinc-950 border border-zinc-800 p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-zinc-850">
              <h3 className="text-base font-bold text-zinc-100">Edit Profile</h3>
              <button
                onClick={() => setIsEditingProfile(false)}
                className="p-1 rounded-lg text-zinc-400 hover:text-zinc-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1.5">
                  Full Name
                </label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-zinc-100 focus:outline-none focus:border-emerald-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1.5">
                  Email Address
                </label>
                <input
                  type="email"
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-zinc-100 focus:outline-none focus:border-emerald-500"
                  required
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditingProfile(false)}
                  className="px-4 py-2 rounded-xl border border-zinc-800 bg-zinc-900 text-xs font-medium text-zinc-400 hover:text-zinc-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-xs transition-all shadow-[0_0_15px_rgba(16,185,129,0.3)]"
                >
                  Save Profile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Friend Modal */}
      {isAddFriendOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-md rounded-2xl bg-zinc-950 border border-zinc-800 p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-zinc-850">
              <h3 className="text-base font-bold text-zinc-100">Add New Friend</h3>
              <button
                onClick={() => setIsAddFriendOpen(false)}
                className="p-1 rounded-lg text-zinc-400 hover:text-zinc-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {friendError && (
              <div className="mb-4 p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-medium">
                {friendError}
              </div>
            )}

            <form onSubmit={handleAddFriend} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1.5">
                  Friend&apos;s Name *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Anurag"
                  value={newFriendName}
                  onChange={(e) => setNewFriendName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-zinc-100 focus:outline-none focus:border-emerald-500"
                  required
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1.5">
                  Phone Number or UPI ID (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. +91 9876543210 or user@upi"
                  value={newFriendPhone}
                  onChange={(e) => setNewFriendPhone(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-zinc-100 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddFriendOpen(false)}
                  className="px-4 py-2 rounded-xl border border-zinc-800 bg-zinc-900 text-xs font-medium text-zinc-400 hover:text-zinc-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingFriend}
                  className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-xs transition-all shadow-[0_0_15px_rgba(16,185,129,0.3)]"
                >
                  {submittingFriend ? "Adding..." : "Add Friend"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Download Statement Modal */}
      <DownloadStatementModal
        isOpen={statementOpen}
        onClose={() => setStatementOpen(false)}
      />
    </div>
  );
}

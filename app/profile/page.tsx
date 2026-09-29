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
  FileSpreadsheet,
  FileText,
  Calendar,
  Sliders,
} from "lucide-react";
import { formatINR } from "@/lib/utils";
import { clearCache, getCached, setCached } from "@/lib/clientCache";
import { DownloadStatementModal } from "@/components/DownloadStatementModal";
import { DashboardSettingsModal } from "@/components/DashboardSettingsModal";

interface Friend {
  _id: string;
  name: string;
  phone?: string;
  netBalance: number;
}

interface Category {
  _id: string;
  name: string;
}

const DEFAULT_USERNAME = process.env.NEXT_PUBLIC_USER_NAME || "Vault Owner";

export default function ProfilePage() {
  const router = useRouter();

  // User Profile State (configurable via env and persisted in localStorage)
  const [username, setUsername] = useState<string>(() => {
    if (typeof window !== "undefined") {
      const saved =
        localStorage.getItem("rupeepulse_username") ||
        localStorage.getItem("rupeepulse_user_name");
      if (saved) return saved;
    }
    return DEFAULT_USERNAME;
  });

  // Modals / Editing state
  const [isEditingProfile, setIsEditingProfile] = useState<boolean>(false);
  const [editUsername, setEditUsername] = useState<string>("");

  // Friends State
  const [friends, setFriends] = useState<Friend[]>([]);
  const [loadingFriends, setLoadingFriends] = useState<boolean>(true);
  const [isAddFriendOpen, setIsAddFriendOpen] = useState<boolean>(false);
  const [newFriendName, setNewFriendName] = useState<string>("");
  const [newFriendPhone, setNewFriendPhone] = useState<string>("");
  const [submittingFriend, setSubmittingFriend] = useState<boolean>(false);
  const [friendError, setFriendError] = useState<string>("");
  const [statementOpen, setStatementOpen] = useState<boolean>(false);
  const [settingsOpen, setSettingsOpen] = useState<boolean>(false);
  const [categories, setCategories] = useState<Category[]>(() => getCached<Category[]>("all_categories") || []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved =
        localStorage.getItem("rupeepulse_username") ||
        localStorage.getItem("rupeepulse_user_name");
      if (saved) setUsername(saved);
    }
    fetchFriends();
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const res = await fetch("/api/categories");
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        const sorted = [...json.data].sort((a: Category, b: Category) => a.name.localeCompare(b.name));
        setCategories(sorted);
        setCached("all_categories", sorted);
      }
    } catch (e) {
      console.error("Failed to load categories", e);
    }
  };

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
    if (editUsername.trim()) {
      setUsername(editUsername.trim());
      localStorage.setItem("rupeepulse_username", editUsername.trim());
      localStorage.setItem("rupeepulse_user_name", editUsername.trim());
    }
    setIsEditingProfile(false);
  };

  const handleOpenEditProfile = () => {
    setEditUsername(username);
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
      if (typeof window !== "undefined") {
        sessionStorage.removeItem("rupeepulse_unlocked");
        sessionStorage.removeItem("rupeepulse_last_active");
        localStorage.removeItem("rupeepulse_last_active");
        window.dispatchEvent(new CustomEvent("vault_lock_requested"));
      }
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/login");
      router.refresh();
    } catch (e) {
      console.error("Lock error", e);
    }
  };

  const initials = (username || "V")
    .trim()
    .split(/\s+/)
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) || "V";

  const handleSlug = username.toLowerCase().replace(/[^a-z0-9_]/g, "");

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

      {/* Main Profile Card (Optimized for Mobile & Desktop) */}
      <div className="rounded-3xl glass-panel p-5 sm:p-7 border border-white/[0.08] relative overflow-hidden">
        <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-emerald-500/40 to-transparent" />

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sm:gap-6">
          {/* Identity info */}
          <div className="flex items-center gap-3.5 sm:gap-4.5 w-full sm:w-auto">
            {/* Mobile-optimized profile avatar icon */}
            <div className="w-13 h-13 sm:w-16 sm:h-16 rounded-2xl bg-zinc-900 border border-emerald-500/40 p-0.5 shadow-[0_0_20px_rgba(16,185,129,0.25)] flex-shrink-0">
              <div className="w-full h-full bg-[#08080c] rounded-[13px] flex items-center justify-center font-black text-lg sm:text-xl text-emerald-400">
                {initials}
              </div>
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <h2 className="text-base sm:text-xl font-black text-zinc-100 truncate">
                  {username}
                </h2>
                <span
                  className="p-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex-shrink-0"
                  title="Verified Vault Owner"
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                </span>
              </div>
              <p className="text-xs text-zinc-400 font-mono mt-0.5 truncate">
                @{handleSlug || "vault"}
              </p>
              <div className="flex items-center gap-1.5 mt-1.5">
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-semibold font-mono">
                  Vault Owner
                </span>
              </div>
            </div>
          </div>

          {/* Action buttons on mobile & desktop */}
          <div className="flex items-center gap-2 w-full sm:w-auto justify-start sm:justify-end pt-3 sm:pt-0 border-t border-zinc-850 sm:border-0">
            <button
              onClick={handleOpenEditProfile}
              className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl bg-zinc-850 hover:bg-zinc-800 border border-zinc-700/80 text-xs font-semibold text-zinc-200 transition-all flex items-center justify-center gap-1.5 active:scale-95 shadow-sm cursor-pointer"
            >
              <Edit3 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Edit Profile</span>
            </button>

            <button
              onClick={handleLockVault}
              className="px-4 py-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-xs font-semibold text-rose-400 transition-all flex items-center justify-center gap-1.5 active:scale-95 cursor-pointer"
              title="Lock vault immediately"
            >
              <Lock className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Lock Vault</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Download Account Statement */}
      <div className="p-5 sm:p-6 rounded-2xl bg-zinc-900/60 border border-zinc-800 hover:border-emerald-500/40 transition-all group relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-32 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="p-3.5 rounded-2xl bg-gradient-to-tr from-emerald-500/20 via-sky-500/10 to-indigo-500/20 border border-emerald-500/30 text-emerald-400 group-hover:scale-105 transition-transform flex-shrink-0 shadow-inner">
              <Download className="w-6 h-6 stroke-[2.2]" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-base font-bold text-zinc-100 group-hover:text-emerald-300 transition-colors">
                  Download Account Statement
                </h3>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono font-medium">
                  Executive PDF & Excel (.xlsx)
                </span>
              </div>
              <p className="text-xs text-zinc-400 mt-1 leading-relaxed max-w-xl">
                Generate professional, auditable financial statements sorted by Date, Payment Mode, Amount, and Category. Choose from Month, Week, Day, Year, or Custom date ranges.
              </p>

              {/* Badges / Features preview */}
              <div className="flex flex-wrap items-center gap-2 mt-3 text-[11px] text-zinc-400">
                <span className="px-2.5 py-1 rounded-lg bg-zinc-850/80 border border-zinc-800 flex items-center gap-1.5 font-mono">
                  <FileText className="w-3 h-3 text-emerald-400" /> Executive PDF
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-zinc-850/80 border border-zinc-800 flex items-center gap-1.5 font-mono">
                  <FileSpreadsheet className="w-3 h-3 text-sky-400" /> Multi-Sheet Excel (.xlsx)
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-zinc-850/80 border border-zinc-800 flex items-center gap-1.5 font-mono">
                  <Calendar className="w-3 h-3 text-amber-400" /> Any Period & Filter
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={() => setStatementOpen(true)}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-sky-400 hover:from-emerald-400 hover:to-sky-300 text-zinc-950 font-bold text-xs transition-all flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(16,185,129,0.3)] active:scale-95 cursor-pointer flex-shrink-0"
          >
            <Download className="w-4 h-4 stroke-[2.5]" />
            <span>Export Statement</span>
          </button>
        </div>
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

      {/* 4 & 5. Customize Dashboard & Category Manager */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Customize Dashboard Option */}
        <button
          onClick={() => setSettingsOpen(true)}
          className="p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800 hover:border-emerald-500/40 hover:bg-emerald-500/5 transition-all group flex items-start justify-between text-left cursor-pointer"
        >
          <div className="flex items-start gap-3.5">
            <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-400 group-hover:scale-105 transition-transform flex-shrink-0">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-zinc-200 group-hover:text-emerald-300 transition-colors">
                Customize Dashboard
              </h3>
              <p className="text-xs text-zinc-500 mt-1 leading-relaxed">
                Configure spending velocity, category charts, payment modes, stealth mode, and biometric lock
              </p>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-zinc-600 group-hover:text-emerald-400 transition-colors flex-shrink-0 mt-1" />
        </button>

        {/* Category Manager Option */}
        <Link
          href="/categories"
          className="p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800 hover:border-emerald-500/40 hover:bg-emerald-500/5 transition-all group flex items-start justify-between"
        >
          <div className="flex items-start gap-3.5">
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 group-hover:scale-105 transition-transform flex-shrink-0">
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
      </div>

      {/* Version Number at Bottom */}
      <div className="pt-6 border-t border-zinc-850 flex flex-col items-center justify-center text-center text-xs text-zinc-500 gap-1 font-mono">
        <span className="font-bold text-zinc-300">RupeePulse PWA</span>
        <span className="text-[11px] text-zinc-400">Version 1.3.0 (Build 2026.09)</span>
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
                  Vault Display Name / Username
                </label>
                <input
                  type="text"
                  value={editUsername}
                  onChange={(e) => setEditUsername(e.target.value)}
                  placeholder="e.g. Vault Owner or Alex"
                  className="w-full px-3.5 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-zinc-100 focus:outline-none focus:border-emerald-500"
                  required
                  autoFocus
                />
                <p className="text-[11px] text-zinc-500 mt-1.5 leading-relaxed">
                  You can also customize your default username in your <code className="text-zinc-300 bg-zinc-900 px-1 py-0.5 rounded border border-zinc-800">.env</code> file with <code className="text-emerald-400 font-mono">NEXT_PUBLIC_USER_NAME</code>.
                </p>
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
                  Save Username
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
        categories={categories}
      />

      {/* Dashboard Settings & Preferences Modal */}
      <DashboardSettingsModal
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
      />
    </div>
  );
}

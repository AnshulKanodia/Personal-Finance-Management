"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  ReceiptIndianRupee,
  Users,
  Tags,
  Plus,
  Lock,
  LogOut,
  IndianRupee,
  User,
  Eye,
  EyeOff,
} from "lucide-react";
import { usePreferences } from "@/lib/preferences";

interface NavbarProps {
  onOpenQuickAdd?: () => void;
  onLock?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenQuickAdd, onLock }) => {
  const pathname = usePathname();
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);
  const { prefs, toggleStealth } = usePreferences();

  // Do not render Navbar on login page
  if (pathname === "/login") return null;

  const handleLogout = async () => {
    try {
      setLoggingOut(true);
      if (typeof window !== "undefined") {
        sessionStorage.removeItem("rupeepulse_unlocked");
        sessionStorage.removeItem("rupeepulse_last_active");
        localStorage.removeItem("rupeepulse_last_active");
        window.dispatchEvent(new CustomEvent("vault_lock_requested"));
      }
      if (onLock) onLock();
      await fetch("/api/auth/logout", { method: "POST" });
    } catch (e) {
      console.error("Logout error", e);
    } finally {
      setLoggingOut(false);
    }
  };

  const navLinks = [
    { href: "/", label: "Dashboard", icon: LayoutDashboard },
    { href: "/transactions", label: "Tracker", icon: IndianRupee },
    { href: "/ledger", label: "Ledger", icon: Users },
    { href: "/profile", label: "Profile", icon: User },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-white/[0.06] bg-[#060608]/75 backdrop-blur-2xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 rounded-xl bg-zinc-900 border border-emerald-500/40 p-0.5 shadow-[0_0_20px_rgba(16,185,129,0.25)] transition-transform group-hover:scale-105">
            <div className="w-full h-full bg-[#08080c] rounded-[10px] flex items-center justify-center">
              <IndianRupee className="w-5 h-5 text-emerald-400 group-hover:text-emerald-300 transition-colors stroke-[2.2]" />
            </div>
          </div>
          <div>
            <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-zinc-100 via-zinc-200 to-zinc-400 bg-clip-text text-transparent">
              RupeePulse
            </span>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive =
              pathname === link.href || (link.href === "/ledger" && pathname === "/khaata");
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-medium transition-all ${
                  isActive
                    ? "bg-zinc-800 text-zinc-100 border border-zinc-700/80 shadow-inner shadow-black/40"
                    : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900"
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? "text-emerald-400" : "text-zinc-400"}`} />
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* Action buttons */}
        <div className="flex items-center gap-2 sm:gap-3">
          {onOpenQuickAdd && (
            <button
              onClick={onOpenQuickAdd}
              className="hidden sm:flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-zinc-950 font-semibold text-sm shadow-[0_0_20px_rgba(16,185,129,0.3)] transition-all active:scale-95"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>Add Transaction</span>
            </button>
          )}

          {/* Stealth Mode Quick Toggle */}
          <button
            onClick={toggleStealth}
            type="button"
            aria-label={prefs.stealthMode ? "Stealth Mode Active" : "Stealth Mode Inactive"}
            title={
              prefs.stealthMode
                ? "Stealth Mode Active (Balances Hidden) • Click to reveal"
                : "Stealth Mode Inactive • Click to hide sensitive numbers"
            }
            className={`flex items-center gap-1.5 p-2 sm:px-3 sm:py-2 rounded-xl border text-xs font-semibold transition-all ${
              prefs.stealthMode
                ? "border-teal-500/50 bg-teal-500/15 text-teal-300 shadow-[0_0_15px_rgba(20,184,166,0.25)]"
                : "border-zinc-800 bg-zinc-900/70 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700"
            }`}
          >
            {prefs.stealthMode ? (
              <>
                <EyeOff className="w-4 h-4 text-teal-400" />
                <span className="hidden md:inline font-mono text-[11px] text-teal-400 font-medium">Stealth ON</span>
              </>
            ) : (
              <>
                <Eye className="w-4 h-4 text-zinc-400" />
                <span className="hidden md:inline font-mono text-[11px] text-zinc-400 font-medium">Stealth</span>
              </>
            )}
          </button>

          <button
            onClick={handleLogout}
            disabled={loggingOut}
            title="Lock Vault"
            className="p-2 sm:p-2.5 rounded-xl border border-zinc-800 bg-zinc-900/60 text-zinc-400 hover:text-rose-400 hover:border-rose-500/30 hover:bg-rose-500/10 transition-all"
          >
            <Lock className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};

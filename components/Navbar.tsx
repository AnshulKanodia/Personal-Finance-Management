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
} from "lucide-react";

interface NavbarProps {
  onOpenQuickAdd?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenQuickAdd }) => {
  const pathname = usePathname();
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);

  // Do not render Navbar on login page
  if (pathname === "/login") return null;

  const handleLogout = async () => {
    try {
      setLoggingOut(true);
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/login");
      router.refresh();
    } catch (e) {
      console.error("Logout error", e);
    } finally {
      setLoggingOut(false);
    }
  };

  const navLinks = [
    { href: "/", label: "Dashboard", icon: LayoutDashboard },
    { href: "/transactions", label: "Tracker", icon: ReceiptIndianRupee },
    { href: "/khaata", label: "Khaata", icon: Users },
    { href: "/categories", label: "Categories", icon: Tags },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-zinc-800/80 bg-zinc-950/80 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600 to-sky-500 p-0.5 shadow-[0_0_20px_rgba(16,185,129,0.3)] transition-transform group-hover:scale-105">
            <div className="w-full h-full bg-zinc-950 rounded-[10px] flex items-center justify-center">
              <IndianRupee className="w-5 h-5 text-emerald-400 group-hover:text-emerald-300 transition-colors" />
            </div>
          </div>
          <div>
            <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-zinc-100 via-zinc-200 to-zinc-400 bg-clip-text text-transparent">
              RupeePulse
            </span>
            <span className="hidden sm:inline-block ml-2 text-[10px] px-1.5 py-0.5 rounded border border-emerald-500/30 text-emerald-400 bg-emerald-500/10 font-mono">
              INR Vault
            </span>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href;
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
              className="flex items-center gap-1.5 px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-zinc-950 font-semibold text-xs sm:text-sm shadow-[0_0_20px_rgba(16,185,129,0.3)] transition-all active:scale-95"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span className="hidden sm:inline">Add Transaction</span>
              <span className="sm:hidden">Add</span>
            </button>
          )}

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

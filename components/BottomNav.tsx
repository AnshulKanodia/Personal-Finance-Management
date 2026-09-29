"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  IndianRupee,
  Users,
  User,
  Plus,
} from "lucide-react";

interface BottomNavProps {
  onOpenQuickAdd: () => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ onOpenQuickAdd }) => {
  const pathname = usePathname();

  if (pathname === "/login") return null;

  const navItems = [
    { href: "/", label: "Dashboard", icon: LayoutDashboard },
    { href: "/transactions", label: "Tracker", icon: IndianRupee },
    { href: "/ledger", label: "Ledger", icon: Users },
    { href: "/profile", label: "Profile", icon: User },
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-zinc-950/90 backdrop-blur-xl border-t border-zinc-850 px-2 py-2 safe-area-bottom">
      <div className="flex items-center justify-around relative">
        {/* First 2 items */}
        {navItems.slice(0, 2).map((item) => {
          const Icon = item.icon;
          const isActive =
            pathname === item.href || (item.href === "/ledger" && pathname === "/khaata");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center flex-1 py-1 transition-colors ${
                isActive ? "text-emerald-400" : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              <Icon className="w-5 h-5 mb-0.5" />
              <span className="text-[10px] font-medium tracking-tight">{item.label}</span>
            </Link>
          );
        })}

        {/* Center Floating "+" Button */}
        <div className="flex-1 flex justify-center -mt-6">
          <button
            onClick={onOpenQuickAdd}
            className="w-13 h-13 p-3.5 rounded-full bg-gradient-to-tr from-emerald-500 to-sky-400 text-zinc-950 shadow-[0_0_25px_rgba(16,185,129,0.5)] border-2 border-zinc-950 flex items-center justify-center transform active:scale-90 transition-transform"
            aria-label="Add transaction"
          >
            <Plus className="w-6 h-6 stroke-[3]" />
          </button>
        </div>

        {/* Last 2 items */}
        {navItems.slice(2, 4).map((item) => {
          const Icon = item.icon;
          const isActive =
            pathname === item.href || (item.href === "/ledger" && pathname === "/khaata");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center flex-1 py-1 transition-colors ${
                isActive ? "text-emerald-400" : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              <Icon className="w-5 h-5 mb-0.5" />
              <span className="text-[10px] font-medium tracking-tight">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
};

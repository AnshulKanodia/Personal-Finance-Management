"use client";

import React, { useState } from "react";
import { Navbar } from "./Navbar";
import { BottomNav } from "./BottomNav";
import { QuickTransactionModal } from "./QuickTransactionModal";
import { QuickDueModal } from "./QuickDueModal";
import { VaultLockScreen } from "./VaultLockScreen";
import { usePathname, useRouter } from "next/navigation";

import { Starfield } from "./Starfield";

export const AppShell: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // In-memory unlock state: Always resets to false on browser reload / refresh!
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const [quickDueOpen, setQuickDueOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  const isAuthPage = pathname === "/login";

  const handleRefresh = () => {
    router.refresh();
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("finance_data_updated"));
    }
  };

  const handleOpenAction = () => {
    if (pathname === "/khaata") {
      setQuickDueOpen(true);
    } else {
      setQuickAddOpen(true);
    }
  };

  return (
    <div className="min-h-screen bg-[#060608] text-zinc-100 flex flex-col selection:bg-emerald-500/30 selection:text-emerald-200 relative overflow-hidden">
      {/* 1. Moving starry night sky */}
      <Starfield />

      {/* 2. High-Tech Dot Matrix Pattern Overlay */}
      <div className="fixed inset-0 dot-grid-pattern opacity-20 pointer-events-none" />

      {/* 3. Automatic Lock Screen: If not unlocked, show PIN lock overlay on refresh/load */}
      {!isUnlocked && !isAuthPage ? (
        <VaultLockScreen onUnlock={() => setIsUnlocked(true)} />
      ) : (
        <>
          {!isAuthPage && (
            <Navbar
              onOpenQuickAdd={handleOpenAction}
              onLock={() => setIsUnlocked(false)}
            />
          )}

          <main
            className={`flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 relative z-10 ${
              !isAuthPage ? "mb-16 md:mb-6" : ""
            }`}
          >
            {children}
          </main>

          {!isAuthPage && <BottomNav onOpenQuickAdd={handleOpenAction} />}

          {/* Quick Transaction Modal */}
          <QuickTransactionModal
            isOpen={quickAddOpen}
            onClose={() => setQuickAddOpen(false)}
            onSuccess={handleRefresh}
          />

          {/* Quick Due Modal */}
          <QuickDueModal
            isOpen={quickDueOpen}
            onClose={() => setQuickDueOpen(false)}
            onSuccess={handleRefresh}
          />
        </>
      )}
    </div>
  );
};

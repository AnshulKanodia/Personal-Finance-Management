"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Navbar } from "./Navbar";
import { BottomNav } from "./BottomNav";
import { QuickTransactionModal } from "./QuickTransactionModal";
import { QuickDueModal } from "./QuickDueModal";
import { VaultLockScreen } from "./VaultLockScreen";
import { usePathname, useRouter } from "next/navigation";

import { Starfield } from "./Starfield";

// Inactivity timeout: 2.5 minutes (150 seconds)
const INACTIVITY_TIMEOUT_MS = 2.5 * 60 * 1000;

export const AppShell: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Check persisted unlock state and verify if within inactivity window
  const [isUnlocked, setIsUnlocked] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    try {
      const unlocked = sessionStorage.getItem("rupeepulse_unlocked") === "true";
      const lastActiveStr =
        localStorage.getItem("rupeepulse_last_active") ||
        sessionStorage.getItem("rupeepulse_last_active");
      const lastActive = Number(lastActiveStr || 0);
      const now = Date.now();

      // If already unlocked and user was active within last 2.5 min, remain unlocked across reloads
      if (unlocked && lastActive && now - lastActive < INACTIVITY_TIMEOUT_MS) {
        localStorage.setItem("rupeepulse_last_active", now.toString());
        sessionStorage.setItem("rupeepulse_last_active", now.toString());
        return true;
      }
    } catch {
      // fallback
    }
    return false;
  });

  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const [quickDueOpen, setQuickDueOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  const isAuthPage = pathname === "/login";

  const handleLock = useCallback(() => {
    setIsUnlocked(false);
    if (typeof window !== "undefined") {
      sessionStorage.removeItem("rupeepulse_unlocked");
      localStorage.removeItem("rupeepulse_last_active");
      sessionStorage.removeItem("rupeepulse_last_active");
    }
  }, []);

  const handleUnlock = useCallback(() => {
    const now = Date.now();
    if (typeof window !== "undefined") {
      sessionStorage.setItem("rupeepulse_unlocked", "true");
      localStorage.setItem("rupeepulse_last_active", now.toString());
      sessionStorage.setItem("rupeepulse_last_active", now.toString());
    }
    setIsUnlocked(true);
  }, []);

  // Inactivity timeout tracker (locks after 2-3 mins of no user interaction)
  useEffect(() => {
    if (!isUnlocked || isAuthPage) return;

    const recordActivity = () => {
      const now = Date.now();
      localStorage.setItem("rupeepulse_last_active", now.toString());
      sessionStorage.setItem("rupeepulse_last_active", now.toString());
    };

    let lastRecord = Date.now();
    const handleActivity = () => {
      const now = Date.now();
      if (now - lastRecord > 2000) {
        lastRecord = now;
        recordActivity();
      }
    };

    // Listen for manual lock requests
    const handleLockEvent = () => {
      handleLock();
    };
    window.addEventListener("vault_lock_requested", handleLockEvent);

    const events: (keyof WindowEventMap)[] = [
      "mousedown",
      "mousemove",
      "keydown",
      "touchstart",
      "scroll",
      "click",
    ];
    events.forEach((ev) => window.addEventListener(ev, handleActivity, { passive: true }));

    // Periodic check every 3 seconds to auto-lock if inactive
    const interval = setInterval(() => {
      const lastActiveStr =
        localStorage.getItem("rupeepulse_last_active") ||
        sessionStorage.getItem("rupeepulse_last_active");
      const lastActive = Number(lastActiveStr || 0);
      if (lastActive && Date.now() - lastActive >= INACTIVITY_TIMEOUT_MS) {
        handleLock();
      }
    }, 3000);

    // Check immediately upon tab visibility / screen unlock
    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        const lastActiveStr =
          localStorage.getItem("rupeepulse_last_active") ||
          sessionStorage.getItem("rupeepulse_last_active");
        const lastActive = Number(lastActiveStr || 0);
        if (lastActive && Date.now() - lastActive >= INACTIVITY_TIMEOUT_MS) {
          handleLock();
        } else {
          handleActivity();
        }
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      window.removeEventListener("vault_lock_requested", handleLockEvent);
      events.forEach((ev) => window.removeEventListener(ev, handleActivity));
      clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [isUnlocked, isAuthPage, handleLock]);

  const handleRefresh = () => {
    router.refresh();
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("finance_data_updated"));
    }
  };

  const handleOpenAction = () => {
    if (pathname === "/khaata" || pathname === "/ledger") {
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

      {/* 3. Automatic Lock Screen: If not unlocked, show PIN lock overlay */}
      {!isUnlocked && !isAuthPage ? (
        <VaultLockScreen onUnlock={handleUnlock} />
      ) : (
        <>
          {!isAuthPage && (
            <Navbar
              onOpenQuickAdd={handleOpenAction}
              onLock={handleLock}
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

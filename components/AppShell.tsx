"use client";

import React, { useState } from "react";
import { Navbar } from "./Navbar";
import { BottomNav } from "./BottomNav";
import { QuickTransactionModal } from "./QuickTransactionModal";
import { QuickDueModal } from "./QuickDueModal";
import { usePathname, useRouter } from "next/navigation";

export const AppShell: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const [quickDueOpen, setQuickDueOpen] = useState(false);
  const [actionChoiceOpen, setActionChoiceOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  const isAuthPage = pathname === "/login";

  const handleRefresh = () => {
    router.refresh();
    // Dispatch custom event so pages can refetch immediately
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("finance_data_updated"));
    }
  };

  const handleOpenAction = () => {
    // If we're on the Khaata page, default to Khaata due modal
    if (pathname === "/khaata") {
      setQuickDueOpen(true);
    } else {
      setQuickAddOpen(true);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col selection:bg-emerald-500/30 selection:text-emerald-200">
      {!isAuthPage && <Navbar onOpenQuickAdd={handleOpenAction} />}

      <main className={`flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 ${!isAuthPage ? "mb-16 md:mb-6" : ""}`}>
        {children}
      </main>

      {!isAuthPage && <BottomNav onOpenQuickAdd={handleOpenAction} />}

      {/* Transaction Modal */}
      <QuickTransactionModal
        isOpen={quickAddOpen}
        onClose={() => setQuickAddOpen(false)}
        onSuccess={handleRefresh}
      />

      {/* Due Modal */}
      <QuickDueModal
        isOpen={quickDueOpen}
        onClose={() => setQuickDueOpen(false)}
        onSuccess={handleRefresh}
      />
    </div>
  );
};

"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  X,
  Check,
  IndianRupee,
  ShieldCheck,
  CheckCircle2,
  QrCode,
  Copy,
  ExternalLink,
  Split,
  Sparkles,
  ArrowRight,
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { formatINR } from "@/lib/utils";
import { clearCache } from "@/lib/clientCache";
import { generateUpiIntentUrl } from "@/lib/whatsappLedger";

interface Category {
  _id: string;
  name: string;
  color: string;
}

interface SettleUpModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  friend: {
    _id: string;
    name: string;
    phone?: string;
    toGive: number;
    toTake: number;
    netBalance: number;
    unsettledCount: number;
  } | null;
}

type SettleMode = "FULL" | "PARTIAL";

export const SettleUpModal: React.FC<SettleUpModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  friend,
}) => {
  const [settleMode, setSettleMode] = useState<SettleMode>("FULL");
  const [partialAmount, setPartialAmount] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [showQrCode, setShowQrCode] = useState<boolean>(false);
  const [myUpiId, setMyUpiId] = useState<string>("");
  const [saveUpiDefault, setSaveUpiDefault] = useState<boolean>(true);
  const [copiedUpi, setCopiedUpi] = useState<boolean>(false);

  // Tracker logging options
  const [logToTracker, setLogToTracker] = useState<boolean>(true);
  const [paymentMode, setPaymentMode] = useState<"UPI" | "CASH">("UPI");
  const [categoryId, setCategoryId] = useState<string>("");
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    if (isOpen) {
      fetchCategories();
      setSettleMode("FULL");
      setPartialAmount("");
      setNotes("");
      setShowQrCode(false);
      setError("");

      if (typeof window !== "undefined") {
        const savedUpi = localStorage.getItem("rupeepulse_upi_id") || "";
        setMyUpiId(savedUpi);
      }
    }
  }, [isOpen, friend]);

  const fetchCategories = async () => {
    try {
      const res = await fetch("/api/categories");
      const json = await res.json();
      if (json.success && json.data.length > 0) {
        setCategories(json.data);
        const defaultCat =
          json.data.find((c: Category) => c.name.toLowerCase().includes("upi")) ||
          json.data.find((c: Category) => c.name.toLowerCase().includes("other")) ||
          json.data[0];
        if (defaultCat) setCategoryId(defaultCat._id);
      }
    } catch (e) {
      console.error("Failed to load categories", e);
    }
  };

  const net = friend?.netBalance || 0; // Positive = friend owes me, Negative = I owe friend
  const absNet = Math.abs(net);
  const isSettledNeutral = net === 0;

  // Numerical value of partial amount
  const parsedPartial = useMemo(() => {
    const num = parseFloat(partialAmount);
    return isNaN(num) ? 0 : Math.max(0, num);
  }, [partialAmount]);

  // Actual amount to settle in this transaction
  const activeSettleAmount = useMemo(() => {
    if (settleMode === "FULL") return absNet;
    return parsedPartial;
  }, [settleMode, absNet, parsedPartial]);

  // Remaining balance after partial payment
  const remainingBalance = useMemo(() => {
    return Math.max(0, absNet - activeSettleAmount);
  }, [absNet, activeSettleAmount]);

  // Username for UPI QR note
  const myName = useMemo(() => {
    if (typeof window === "undefined") return "RupeePulse";
    return (
      localStorage.getItem("rupeepulse_username") ||
      localStorage.getItem("rupeepulse_user_name") ||
      "RupeePulse"
    );
  }, []);

  // UPI URL payload
  const upiIntentUrl = useMemo(() => {
    if (!myUpiId.trim() || activeSettleAmount <= 0) return "";
    return generateUpiIntentUrl({
      upiId: myUpiId.trim(),
      name: myName,
      amount: activeSettleAmount,
      note: `Settlement from ${friend?.name || "Friend"}`,
    });
  }, [myUpiId, myName, activeSettleAmount, friend]);

  if (!isOpen || !friend) return null;

  const handleCopyUpi = async () => {
    if (myUpiId.trim() && typeof navigator !== "undefined" && navigator.clipboard) {
      await navigator.clipboard.writeText(myUpiId.trim());
      setCopiedUpi(true);
      setTimeout(() => setCopiedUpi(false), 2000);
    }
  };

  const handleSettle = async () => {
    try {
      setLoading(true);
      setError("");

      if (settleMode === "PARTIAL") {
        if (!parsedPartial || parsedPartial <= 0) {
          setError("Please enter a valid partial settlement amount greater than ₹0");
          setLoading(false);
          return;
        }
        if (parsedPartial > absNet) {
          setError(`Partial amount cannot exceed the total balance of ₹${absNet}`);
          setLoading(false);
          return;
        }
      }

      // Persist UPI ID if user edited it
      if (saveUpiDefault && myUpiId.trim() && typeof window !== "undefined") {
        localStorage.setItem("rupeepulse_upi_id", myUpiId.trim());
      }

      const res = await fetch("/api/dues/settle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          friendId: friend._id,
          settleType: settleMode,
          amount: settleMode === "PARTIAL" ? parsedPartial : absNet,
          logToTracker: logToTracker && !isSettledNeutral && activeSettleAmount > 0,
          categoryId: categoryId || undefined,
          paymentMode,
          notes: notes.trim() || undefined,
        }),
      });

      const json = await res.json();
      if (!json.success) {
        setError(json.message || "Failed to settle dues");
        return;
      }

      clearCache();
      window.dispatchEvent(new CustomEvent("finance_data_updated"));
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to process settlement");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-2xl bg-zinc-950 border border-zinc-800 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-zinc-850 flex items-center justify-between shrink-0 bg-zinc-950/80 backdrop-blur-sm">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            <span className="text-sm sm:text-base font-bold text-zinc-100">Settle Up Khaata</span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/80 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-5 space-y-4 overflow-y-auto custom-scrollbar text-xs">
          {error && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-medium animate-shake">
              {error}
            </div>
          )}

          {/* Friend Profile & Balance Summary */}
          <div className="p-4 rounded-xl bg-zinc-900/70 border border-zinc-800 text-center">
            <h4 className="text-sm font-semibold text-zinc-300">{friend.name}</h4>
            <div className="mt-2 text-2xl sm:text-3xl font-black font-mono">
              {net > 0 && <span className="text-emerald-400">+{formatINR(absNet)}</span>}
              {net < 0 && <span className="text-rose-400">-{formatINR(absNet)}</span>}
              {net === 0 && <span className="text-zinc-400">₹0 (All Squared)</span>}
            </div>
            <p className="text-xs text-zinc-400 mt-1">
              {net > 0 && `${friend.name} will pay you ${formatINR(absNet)}`}
              {net < 0 && `You will pay ${friend.name} ${formatINR(absNet)}`}
              {net === 0 && "Balances are already balanced out."}
            </p>
            <div className="mt-2 text-[11px] text-zinc-500 font-mono">
              Unsettled entries: {friend.unsettledCount} (To Give: {formatINR(friend.toGive)} • To Take: {formatINR(friend.toTake)})
            </div>
          </div>

          {!isSettledNeutral && (
            <>
              {/* Settle Mode Tabs: Full vs Partial */}
              <div className="grid grid-cols-2 p-1 rounded-xl bg-zinc-900 border border-zinc-800">
                <button
                  type="button"
                  onClick={() => setSettleMode("FULL")}
                  className={`py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                    settleMode === "FULL"
                      ? "bg-zinc-800 text-zinc-100 shadow-md border border-zinc-700/80"
                      : "text-zinc-400 hover:text-zinc-200"
                  }`}
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Full Zero-Out ({formatINR(absNet)})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSettleMode("PARTIAL")}
                  className={`py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                    settleMode === "PARTIAL"
                      ? "bg-zinc-800 text-zinc-100 shadow-md border border-zinc-700/80"
                      : "text-zinc-400 hover:text-zinc-200"
                  }`}
                >
                  <Split className="w-3.5 h-3.5 text-sky-400" />
                  <span>Partial Settlement</span>
                </button>
              </div>

              {/* Partial Amount Input & Quick Chips */}
              {settleMode === "PARTIAL" && (
                <div className="p-3.5 rounded-xl bg-zinc-900/50 border border-zinc-800 space-y-3 animate-in fade-in duration-150">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-zinc-200">
                      Enter Partial Payment Amount (₹)
                    </label>
                    <span className="text-[11px] font-mono text-zinc-400">
                      Max: {formatINR(absNet)}
                    </span>
                  </div>

                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-400 font-bold">
                      ₹
                    </span>
                    <input
                      type="number"
                      step="any"
                      placeholder="0.00"
                      value={partialAmount}
                      onChange={(e) => setPartialAmount(e.target.value)}
                      className="w-full pl-8 pr-4 py-2.5 bg-zinc-900 border border-zinc-700/80 rounded-xl text-sm font-bold text-zinc-100 focus:outline-none focus:border-sky-500 font-mono"
                      autoFocus
                    />
                  </div>

                  {/* Quick percentage pills */}
                  <div className="flex items-center gap-1.5 pt-1 overflow-x-auto no-scrollbar">
                    {[
                      { label: "25%", val: Math.round(absNet * 0.25) },
                      { label: "50%", val: Math.round(absNet * 0.5) },
                      { label: "75%", val: Math.round(absNet * 0.75) },
                      { label: "Custom ₹500", val: 500 },
                      { label: "Custom ₹1,000", val: 1000 },
                    ].map((pill, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setPartialAmount(pill.val.toString())}
                        disabled={pill.val > absNet}
                        className="px-2.5 py-1 rounded-lg text-[10px] font-semibold bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-300 hover:text-white shrink-0 disabled:opacity-30 disabled:hover:bg-zinc-800"
                      >
                        {pill.label} ({formatINR(pill.val)})
                      </button>
                    ))}
                  </div>

                  {/* Remaining balance preview */}
                  <div className="p-2.5 rounded-lg bg-zinc-950/70 border border-zinc-850 flex items-center justify-between text-xs">
                    <span className="text-zinc-400">Remaining Balance:</span>
                    <span className="font-mono font-bold text-sky-400">
                      {formatINR(remainingBalance)}
                    </span>
                  </div>
                </div>
              )}

              {/* UPI QR Code Accordion Button */}
              <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/30 overflow-hidden">
                <button
                  type="button"
                  onClick={() => setShowQrCode(!showQrCode)}
                  className="w-full p-3 flex items-center justify-between text-left hover:bg-zinc-850/50 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <QrCode className="w-4 h-4 text-sky-400" />
                    <div>
                      <span className="text-xs font-semibold text-zinc-200">
                        {net > 0 ? "Show Instant UPI QR Code" : "Pay via UPI App"}
                      </span>
                      <p className="text-[10px] text-zinc-500">
                        {net > 0
                          ? `Display QR code for ${formatINR(activeSettleAmount)} on your screen`
                          : "Launch payment app directly"}
                      </p>
                    </div>
                  </div>
                  <span className="text-[11px] font-semibold text-sky-400">
                    {showQrCode ? "Hide QR" : "Show QR"}
                  </span>
                </button>

                {showQrCode && (
                  <div className="p-4 border-t border-zinc-800/80 space-y-3 bg-zinc-950/60 animate-in fade-in duration-200">
                    {net > 0 ? (
                      <>
                        <div className="space-y-1">
                          <label className="text-[11px] font-semibold text-zinc-300">
                            Your Receiving UPI ID
                          </label>
                          <div className="relative">
                            <input
                              type="text"
                              placeholder="e.g. user@okhdfcbank or 9876543210@paytm"
                              value={myUpiId}
                              onChange={(e) => setMyUpiId(e.target.value)}
                              className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-zinc-100 font-mono focus:outline-none focus:border-sky-500"
                            />
                            {myUpiId && (
                              <button
                                type="button"
                                onClick={handleCopyUpi}
                                className="absolute right-2 top-1.5 p-1 text-zinc-400 hover:text-white"
                                title="Copy UPI ID"
                              >
                                {copiedUpi ? (
                                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                                ) : (
                                  <Copy className="w-3.5 h-3.5" />
                                )}
                              </button>
                            )}
                          </div>
                          <div className="flex items-center gap-1.5 pt-1">
                            <input
                              type="checkbox"
                              id="rememberUpi"
                              checked={saveUpiDefault}
                              onChange={(e) => setSaveUpiDefault(e.target.checked)}
                              className="rounded border-zinc-700 text-sky-500 focus:ring-sky-500 bg-zinc-900"
                            />
                            <label htmlFor="rememberUpi" className="text-[10px] text-zinc-400 cursor-pointer">
                              Save as my default UPI ID
                            </label>
                          </div>
                        </div>

                        {/* QR Code Container */}
                        {myUpiId.trim() && activeSettleAmount > 0 ? (
                          <div className="flex flex-col items-center justify-center p-4 rounded-2xl bg-zinc-900/80 border border-zinc-800 text-center">
                            <div className="p-3 bg-white rounded-xl shadow-lg inline-block">
                              <QRCodeSVG
                                value={upiIntentUrl}
                                size={160}
                                level="M"
                                includeMargin={false}
                              />
                            </div>
                            <div className="mt-2.5 font-bold text-xs text-zinc-200">
                              Scan to Pay {formatINR(activeSettleAmount)}
                            </div>
                            <div className="text-[10px] text-zinc-400 font-mono mt-0.5">
                              to {myUpiId}
                            </div>
                            <div className="flex items-center gap-1.5 mt-2 text-[10px] text-emerald-400/90 font-medium">
                              <Sparkles className="w-3 h-3 text-emerald-400" />
                              <span>Compatible with GPay, PhonePe, Paytm, CRED & BHIM</span>
                            </div>
                          </div>
                        ) : (
                          <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-800 text-center text-zinc-400 text-xs">
                            Enter your UPI ID above to generate the live scan QR code.
                          </div>
                        )}
                      </>
                    ) : (
                      /* User owes friend money */
                      <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-800 space-y-2 text-center">
                        <p className="text-xs text-zinc-300">
                          Ready to pay {formatINR(activeSettleAmount)} to {friend.name}?
                        </p>
                        {friend.phone && (
                          <button
                            type="button"
                            onClick={() => {
                              const payUrl = `upi://pay?pa=${friend.phone}&pn=${encodeURIComponent(
                                friend.name
                              )}&am=${activeSettleAmount}&cu=INR`;
                              if (typeof window !== "undefined") {
                                window.location.href = payUrl;
                              }
                            }}
                            className="w-full py-2 px-3 rounded-xl font-bold text-xs bg-sky-500 hover:bg-sky-400 text-zinc-950 flex items-center justify-center gap-1.5 transition-all shadow-md"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                            <span>Launch Payment App on Phone</span>
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Notes Input */}
              <div>
                <label className="block text-[11px] font-semibold text-zinc-400 mb-1">
                  Optional Settlement Note
                </label>
                <input
                  type="text"
                  placeholder={
                    settleMode === "PARTIAL"
                      ? "e.g. Paid 1st installment via GPay"
                      : "e.g. Full settlement done"
                  }
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-zinc-200 focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Option to log to Tracker */}
              <div className="p-3.5 rounded-xl bg-zinc-900/40 border border-zinc-850 space-y-2.5">
                <label className="flex items-start gap-2.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={logToTracker}
                    onChange={(e) => setLogToTracker(e.target.checked)}
                    className="mt-0.5 rounded border-zinc-700 text-emerald-500 focus:ring-emerald-500 focus:ring-offset-0 bg-zinc-900"
                  />
                  <div>
                    <span className="text-xs font-bold text-zinc-200">
                      Auto-log to Main Expense Tracker
                    </span>
                    <p className="text-[11px] text-zinc-400 mt-0.5">
                      Records {formatINR(activeSettleAmount)} as{" "}
                      <span
                        className={
                          net > 0
                            ? "text-emerald-400 font-semibold"
                            : "text-rose-400 font-semibold"
                        }
                      >
                        {net > 0 ? "Income (Received)" : "Expense (Paid)"}
                      </span>{" "}
                      in your tracker.
                    </p>
                  </div>
                </label>

                {logToTracker && (
                  <div className="pt-2 border-t border-zinc-800/80 space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <span className="block text-[10px] uppercase font-bold text-zinc-400 mb-1">
                          Mode
                        </span>
                        <div className="grid grid-cols-2 gap-1">
                          <button
                            type="button"
                            onClick={() => setPaymentMode("UPI")}
                            className={`py-1.5 px-2 rounded-lg text-xs font-semibold border ${
                              paymentMode === "UPI"
                                ? "text-sky-400 border-sky-500/40 bg-sky-500/10"
                                : "border-zinc-800 text-zinc-400 bg-zinc-900"
                            }`}
                          >
                            UPI
                          </button>
                          <button
                            type="button"
                            onClick={() => setPaymentMode("CASH")}
                            className={`py-1.5 px-2 rounded-lg text-xs font-semibold border ${
                              paymentMode === "CASH"
                                ? "text-amber-400 border-amber-500/40 bg-amber-500/10"
                                : "border-zinc-800 text-zinc-400 bg-zinc-900"
                            }`}
                          >
                            Cash
                          </button>
                        </div>
                      </div>
                      <div>
                        <span className="block text-[10px] uppercase font-bold text-zinc-400 mb-1">
                          Category
                        </span>
                        <select
                          value={categoryId}
                          onChange={(e) => setCategoryId(e.target.value)}
                          className="w-full px-2 py-1.5 bg-zinc-900 border border-zinc-800 rounded-lg text-xs text-zinc-200 focus:outline-none focus:border-emerald-500"
                        >
                          {categories.map((c) => (
                            <option key={c._id} value={c._id}>
                              {c.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}

          {/* Settle Action Button */}
          <button
            onClick={handleSettle}
            disabled={loading || (settleMode === "PARTIAL" && activeSettleAmount <= 0)}
            className="w-full py-3 rounded-xl font-bold text-xs sm:text-sm bg-gradient-to-r from-emerald-500 to-sky-400 hover:from-emerald-400 hover:to-sky-300 text-zinc-950 transition-all flex items-center justify-center gap-2 active:scale-98 shadow-[0_0_20px_rgba(16,185,129,0.3)] disabled:opacity-50"
          >
            {loading ? (
              <span>Processing settlement...</span>
            ) : settleMode === "PARTIAL" ? (
              <>
                <Split className="w-4 h-4 stroke-[2.5]" />
                <span>
                  Record Partial Payment of {formatINR(activeSettleAmount)}
                </span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
                <span>Zero Out & Settle Up Balance ({formatINR(absNet)})</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

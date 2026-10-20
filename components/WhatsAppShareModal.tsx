"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  X,
  Copy,
  Check,
  Share2,
  ExternalLink,
  MessageCircle,
  IndianRupee,
  Phone,
  QrCode,
  Sparkles,
} from "lucide-react";
import { formatINR } from "@/lib/utils";
import {
  formatWhatsAppLedgerMessage,
  buildWhatsAppShareUrl,
  sanitizeWhatsAppPhone,
  WhatsAppDueItem,
} from "@/lib/whatsappLedger";

interface Friend {
  _id: string;
  name: string;
  phone?: string;
  toGive: number;
  toTake: number;
  netBalance: number;
  unsettledCount: number;
}

interface WhatsAppShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  friend: Friend | null;
  dues: WhatsAppDueItem[];
}

// WhatsApp brand SVG icon
export const WhatsAppIcon: React.FC<{ className?: string }> = ({ className = "w-4 h-4" }) => (
  <svg
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
    aria-hidden="true"
  >
    <path d="M17.472 14.382c-.301-.15-1.78-.878-2.056-.978-.276-.101-.476-.15-.677.15-.2.301-.777.978-.952 1.179-.176.2-.351.226-.652.075-.301-.151-1.27-.468-2.42-1.493-.895-.798-1.5-1.783-1.676-2.084-.176-.301-.019-.464.132-.614.136-.135.301-.351.452-.527.15-.176.2-.301.301-.501.101-.2.051-.376-.025-.526-.075-.151-.677-1.63-.928-2.232-.244-.587-.492-.507-.677-.516-.175-.008-.376-.01-.577-.01-.2 0-.526.075-.802.376-.276.301-1.053 1.028-1.053 2.508s1.078 2.91 1.228 3.111c.15.201 2.122 3.24 5.14 4.544.718.31 1.278.496 1.716.635.722.23 1.38.197 1.9.12.58-.087 1.78-.727 2.03-1.43.251-.702.251-1.304.176-1.43-.075-.126-.276-.201-.577-.351zM12.04 2C6.54 2 2.07 6.47 2.07 11.97c0 1.93.55 3.73 1.5 5.26L2 22l4.9-1.54c1.47.88 3.19 1.39 5.04 1.39 5.5 0 9.97-4.47 9.97-9.97S17.54 2 12.04 2zm0 18.25c-1.67 0-3.23-.49-4.55-1.33l-.33-.21-2.92.92.93-2.85-.23-.36c-.95-1.48-1.48-3.23-1.48-5.05 0-4.66 3.79-8.45 8.45-8.45 4.66 0 8.45 3.79 8.45 8.45 0 4.66-3.79 8.45-8.45 8.45z" />
  </svg>
);

export const WhatsAppShareModal: React.FC<WhatsAppShareModalProps> = ({
  isOpen,
  onClose,
  friend,
  dues,
}) => {
  const [includeBreakdown, setIncludeBreakdown] = useState<boolean>(true);
  const [customNote, setCustomNote] = useState<string>("");
  const [phoneInput, setPhoneInput] = useState<string>("");
  const [myUpiId, setMyUpiId] = useState<string>("");
  const [saveUpiDefault, setSaveUpiDefault] = useState<boolean>(true);
  const [copied, setCopied] = useState<boolean>(false);
  const [canNativeShare, setCanNativeShare] = useState<boolean>(false);

  // Initialize data on modal open
  useEffect(() => {
    if (isOpen && friend) {
      setPhoneInput(friend.phone || "");
      setCustomNote("");
      setCopied(false);

      if (typeof window !== "undefined") {
        const savedUpi = localStorage.getItem("rupeepulse_upi_id") || "";
        setMyUpiId(savedUpi);
        setCanNativeShare(typeof navigator !== "undefined" && !!navigator.share);
      }
    }
  }, [isOpen, friend]);

  const sanitizedPhone = useMemo(() => {
    return sanitizeWhatsAppPhone(phoneInput);
  }, [phoneInput]);

  const generatedMessage = useMemo(() => {
    if (!friend) return "";
    let myName = "Me";
    if (typeof window !== "undefined") {
      myName =
        localStorage.getItem("rupeepulse_username") ||
        localStorage.getItem("rupeepulse_user_name") ||
        "Me";
    }

    return formatWhatsAppLedgerMessage({
      friendName: friend.name,
      netBalance: friend.netBalance,
      dues,
      myName,
      myUpiId: myUpiId.trim(),
      includeBreakdown,
      customNote,
    });
  }, [friend, dues, myUpiId, includeBreakdown, customNote]);

  const whatsappUrl = useMemo(() => {
    return buildWhatsAppShareUrl(phoneInput, generatedMessage);
  }, [phoneInput, generatedMessage]);

  const handleCopy = async () => {
    try {
      if (typeof navigator !== "undefined" && navigator.clipboard) {
        await navigator.clipboard.writeText(generatedMessage);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch (e) {
      console.error("Failed to copy", e);
    }
  };

  const handleNativeShare = async () => {
    try {
      if (typeof navigator !== "undefined" && navigator.share) {
        await navigator.share({
          title: `RupeePulse Split - ${friend?.name}`,
          text: generatedMessage,
        });
      }
    } catch (e) {
      // User cancelled share
    }
  };

  const handleOpenWhatsApp = () => {
    // If user typed a UPI ID and checked save default, persist it
    if (saveUpiDefault && myUpiId.trim() && typeof window !== "undefined") {
      localStorage.setItem("rupeepulse_upi_id", myUpiId.trim());
    }

    if (typeof window !== "undefined") {
      window.open(whatsappUrl, "_blank", "noopener,noreferrer");
    }
    onClose();
  };

  if (!isOpen || !friend) return null;

  const net = friend.netBalance;
  const absNet = Math.abs(net);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-2xl bg-zinc-950 border border-zinc-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-zinc-850 flex items-center justify-between shrink-0 bg-zinc-950/80 backdrop-blur-sm">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.2)]">
              <WhatsAppIcon className="w-4 h-4 fill-emerald-400" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-zinc-100 flex items-center gap-2">
                <span>WhatsApp Split Summary</span>
              </h3>
              <p className="text-[11px] text-zinc-400">
                1-tap balance reminder for {friend.name}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/80 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Content */}
        <div className="p-4 sm:p-5 space-y-4 overflow-y-auto custom-scrollbar text-xs">
          {/* Quick Balance Status Pill */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-zinc-900/60 border border-zinc-800">
            <div>
              <span className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider">
                Current Net Position
              </span>
              <div className="text-base sm:text-lg font-black font-mono mt-0.5">
                {net > 0 && <span className="text-emerald-400">+{formatINR(absNet)} (Owes you)</span>}
                {net < 0 && <span className="text-rose-400">-{formatINR(absNet)} (You owe)</span>}
                {net === 0 && <span className="text-zinc-400">₹0 (All Squared)</span>}
              </div>
            </div>
            <div className="text-right text-[11px] text-zinc-500 font-mono">
              {dues.length} pending line item{dues.length === 1 ? "" : "s"}
            </div>
          </div>

          {/* Phone Number Input */}
          <div>
            <label className="block text-[11px] font-semibold text-zinc-300 mb-1">
              Recipient Phone Number (Optional for Direct Chat)
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-500">
                <Phone className="w-3.5 h-3.5" />
              </div>
              <input
                type="text"
                placeholder="e.g. 9876543210 or +91 98765 43210"
                value={phoneInput}
                onChange={(e) => setPhoneInput(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-zinc-200 focus:outline-none focus:border-emerald-500/80 transition-colors"
              />
            </div>
            <p className="text-[10px] text-zinc-500 mt-1">
              {sanitizedPhone ? (
                <span className="text-emerald-400/90 font-mono">
                  ✓ Verified: WhatsApp will direct-open +{sanitizedPhone}
                </span>
              ) : (
                <span>Leave blank to choose from your WhatsApp contact list directly.</span>
              )}
            </p>
          </div>

          {/* Optional UPI Settle ID (if friend owes money) */}
          {net > 0 && (
            <div className="p-3 rounded-xl bg-zinc-900/40 border border-zinc-800/80 space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-semibold text-zinc-300 flex items-center gap-1.5">
                  <QrCode className="w-3.5 h-3.5 text-sky-400" />
                  <span>Attach Your UPI ID for Instant Settle</span>
                </label>
                <span className="text-[10px] text-zinc-500 font-mono">Optional</span>
              </div>
              <input
                type="text"
                placeholder="e.g. yourname@okhdfcbank or 9876543210@paytm"
                value={myUpiId}
                onChange={(e) => setMyUpiId(e.target.value)}
                className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-zinc-200 focus:outline-none focus:border-sky-500/80 transition-colors font-mono"
              />
              <div className="flex items-center gap-2 pt-0.5">
                <input
                  type="checkbox"
                  id="saveUpi"
                  checked={saveUpiDefault}
                  onChange={(e) => setSaveUpiDefault(e.target.checked)}
                  className="rounded border-zinc-700 text-sky-500 focus:ring-sky-500 focus:ring-offset-0 bg-zinc-900"
                />
                <label htmlFor="saveUpi" className="text-[11px] text-zinc-400 cursor-pointer">
                  Save as my default UPI ID for future settlements
                </label>
              </div>
            </div>
          )}

          {/* Breakdown Toggle */}
          <div className="flex items-center justify-between p-2.5 rounded-xl bg-zinc-900/30 border border-zinc-850">
            <span className="text-xs text-zinc-300 font-medium">
              Include line-item entries breakdown
            </span>
            <input
              type="checkbox"
              checked={includeBreakdown}
              onChange={(e) => setIncludeBreakdown(e.target.checked)}
              className="rounded border-zinc-700 text-emerald-500 focus:ring-emerald-500 focus:ring-offset-0 bg-zinc-900 w-4 h-4"
            />
          </div>

          {/* Live Chat Bubble Preview */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider">
                WhatsApp Message Preview
              </span>
              <button
                type="button"
                onClick={handleCopy}
                className="text-[11px] font-semibold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 transition-colors"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy Text</span>
                  </>
                )}
              </button>
            </div>

            <div className="p-3.5 rounded-2xl bg-[#0b141a] border border-[#1f2c34] text-zinc-200 text-xs font-sans whitespace-pre-wrap leading-relaxed shadow-inner max-h-48 overflow-y-auto custom-scrollbar select-text">
              {generatedMessage}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-zinc-850 bg-zinc-950/90 flex flex-col sm:flex-row items-center gap-2 shrink-0">
          {canNativeShare && (
            <button
              type="button"
              onClick={handleNativeShare}
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-zinc-800 hover:border-zinc-700 bg-zinc-900 text-zinc-300 font-semibold text-xs flex items-center justify-center gap-1.5 transition-all active:scale-95"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Share...</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleCopy}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-zinc-800 hover:border-zinc-700 bg-zinc-900 text-zinc-300 font-semibold text-xs flex items-center justify-center gap-1.5 transition-all active:scale-95"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span>Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handleOpenWhatsApp}
            className="w-full sm:flex-1 py-2.5 px-4 rounded-xl font-bold text-xs bg-[#25D366] hover:bg-[#20ba59] text-zinc-950 flex items-center justify-center gap-2 transition-all active:scale-95 shadow-[0_0_20px_rgba(37,211,102,0.3)]"
          >
            <WhatsAppIcon className="w-4 h-4 fill-zinc-950" />
            <span>Open in WhatsApp</span>
            <ExternalLink className="w-3.5 h-3.5 opacity-70" />
          </button>
        </div>
      </div>
    </div>
  );
};

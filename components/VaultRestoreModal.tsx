"use client";

import React, { useState, useRef } from "react";
import {
  X,
  Upload,
  FileCheck,
  AlertTriangle,
  RotateCcw,
  CheckCircle2,
  Database,
  ArrowRight,
  ShieldAlert,
  Loader2,
  Users,
  IndianRupee,
  Tags,
  Receipt,
} from "lucide-react";
import { clearCache } from "@/lib/clientCache";

interface VaultRestoreModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

interface ParsedBackupInfo {
  version?: string;
  exportedAt?: string;
  transactionsCount: number;
  friendsCount: number;
  duesCount: number;
  categoriesCount: number;
  groupsCount: number;
  fileName: string;
  fileSize: string;
}

export const VaultRestoreModal: React.FC<VaultRestoreModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [fileData, setFileData] = useState<any | null>(null);
  const [fileInfo, setFileInfo] = useState<ParsedBackupInfo | null>(null);
  const [parseError, setParseError] = useState<string>("");
  const [mode, setMode] = useState<"merge" | "replace">("merge");
  const [confirmText, setConfirmText] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [restoreSuccess, setRestoreSuccess] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleReset = () => {
    setFileData(null);
    setFileInfo(null);
    setParseError("");
    setConfirmText("");
    setRestoreSuccess(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleClose = () => {
    handleReset();
    onClose();
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const processFile = (file: File) => {
    setParseError("");
    setRestoreSuccess(null);

    if (!file.name.endsWith(".json")) {
      setParseError("Please select a valid .json backup file");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const parsed = JSON.parse(text);

        const rawData = parsed.data || parsed;
        const transactions = Array.isArray(rawData.transactions) ? rawData.transactions : [];
        const friends = Array.isArray(rawData.friends) ? rawData.friends : [];
        const dues = Array.isArray(rawData.friendDues) ? rawData.friendDues : [];
        const categories = Array.isArray(rawData.categories) ? rawData.categories : [];
        const groups = Array.isArray(rawData.groups) ? rawData.groups : [];

        if (
          transactions.length === 0 &&
          friends.length === 0 &&
          dues.length === 0 &&
          categories.length === 0
        ) {
          setParseError("The uploaded file does not contain recognized RupeePulse financial data.");
          setFileData(null);
          setFileInfo(null);
          return;
        }

        setFileData(parsed);
        setFileInfo({
          version: parsed.version || "1.x",
          exportedAt: parsed.exportedAt || undefined,
          transactionsCount: transactions.length,
          friendsCount: friends.length,
          duesCount: dues.length,
          categoriesCount: categories.length,
          groupsCount: groups.length,
          fileName: file.name,
          fileSize: formatFileSize(file.size),
        });
      } catch (err: any) {
        setParseError("Failed to parse JSON file: " + (err.message || "Invalid syntax"));
        setFileData(null);
        setFileInfo(null);
      }
    };
    reader.onerror = () => {
      setParseError("Failed to read file from disk");
    };
    reader.readAsText(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleExecuteRestore = async () => {
    if (!fileData) return;
    if (mode === "replace" && confirmText.trim().toUpperCase() !== "RESTORE") {
      setParseError("Please type RESTORE to confirm replacement");
      return;
    }

    try {
      setIsSubmitting(true);
      setParseError("");

      const res = await fetch("/api/restore", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          backup: fileData,
          mode,
        }),
      });

      const json = await res.json();
      if (!json.success) {
        setParseError(json.message || "Failed to restore records");
        return;
      }

      setRestoreSuccess(json.message || "Vault restored successfully!");
      clearCache();
      window.dispatchEvent(new CustomEvent("finance_data_updated"));

      if (onSuccess) onSuccess();

      setTimeout(() => {
        handleClose();
      }, 2000);
    } catch (err: any) {
      setParseError(err.message || "Network error while restoring vault");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-3xl bg-zinc-950 border border-zinc-800 shadow-2xl overflow-hidden max-h-[85vh] sm:max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-zinc-850 flex items-center justify-between bg-zinc-900/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-sky-500 to-indigo-600 p-0.5 flex items-center justify-center shadow-[0_0_15px_rgba(99,102,241,0.25)]">
              <div className="w-full h-full bg-zinc-950 rounded-[14px] flex items-center justify-center">
                <RotateCcw className="w-4 h-4 text-sky-400" />
              </div>
            </div>
            <div>
              <h3 className="text-base font-bold text-zinc-100 flex items-center gap-2">
                <span>Restore Financial Vault</span>
              </h3>
              <p className="text-xs text-zinc-400 mt-0.5">
                Import records from an offline JSON backup archive
              </p>
            </div>
          </div>

          <button
            onClick={handleClose}
            className="p-1.5 rounded-xl text-zinc-400 hover:text-zinc-200 hover:bg-zinc-850 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5">
          {restoreSuccess ? (
            <div className="py-8 flex flex-col items-center justify-center text-center space-y-3">
              <div className="w-14 h-14 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                <CheckCircle2 className="w-8 h-8 stroke-[2.2]" />
              </div>
              <h4 className="text-base font-bold text-zinc-100">Restore Successful!</h4>
              <p className="text-xs text-zinc-400 max-w-sm">{restoreSuccess}</p>
              <span className="text-[11px] text-emerald-400 font-mono">
                Updating your dashboard in a moment...
              </span>
            </div>
          ) : (
            <>
              {/* File Upload Zone */}
              {!fileInfo ? (
                <div
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-zinc-800 hover:border-sky-500/50 bg-zinc-900/40 hover:bg-zinc-900/60 rounded-2xl p-7 text-center transition-all cursor-pointer flex flex-col items-center justify-center group"
                >
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept=".json,application/json"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <div className="w-12 h-12 rounded-2xl bg-sky-500/10 border border-sky-500/20 text-sky-400 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                    <Upload className="w-6 h-6 stroke-[2]" />
                  </div>
                  <p className="text-sm font-bold text-zinc-200">
                    Click to select or drag & drop backup file
                  </p>
                  <p className="text-xs text-zinc-500 mt-1">
                    Accepts <code className="text-zinc-400 font-mono">.json</code> format
                    exported from RupeePulse
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* File Detected Card */}
                  <div className="p-4 rounded-2xl bg-zinc-900/80 border border-zinc-800 relative">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-400 flex items-center justify-center flex-shrink-0">
                          <FileCheck className="w-5 h-5" />
                        </div>
                        <div className="min-w-0">
                          <div className="text-sm font-bold text-zinc-200 truncate">
                            {fileInfo.fileName}
                          </div>
                          <div className="text-xs text-zinc-500 font-mono flex items-center gap-2">
                            <span>{fileInfo.fileSize}</span>
                            {fileInfo.version && <span>• v{fileInfo.version}</span>}
                            {fileInfo.exportedAt && (
                              <span>• {new Date(fileInfo.exportedAt).toLocaleDateString()}</span>
                            )}
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={handleReset}
                        className="text-xs text-zinc-400 hover:text-rose-400 p-1.5 transition-colors cursor-pointer"
                        title="Choose different file"
                      >
                        Change
                      </button>
                    </div>

                    {/* Stats pills */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-3 pt-3 border-t border-zinc-800/80 text-xs font-mono">
                      <div className="p-2 rounded-xl bg-zinc-950 border border-zinc-850 flex flex-col items-center">
                        <span className="text-zinc-500 text-[10px]">Transactions</span>
                        <span className="font-bold text-emerald-400 text-sm mt-0.5">
                          {fileInfo.transactionsCount}
                        </span>
                      </div>
                      <div className="p-2 rounded-xl bg-zinc-950 border border-zinc-850 flex flex-col items-center">
                        <span className="text-zinc-500 text-[10px]">Friends</span>
                        <span className="font-bold text-sky-400 text-sm mt-0.5">
                          {fileInfo.friendsCount}
                        </span>
                      </div>
                      <div className="p-2 rounded-xl bg-zinc-950 border border-zinc-850 flex flex-col items-center">
                        <span className="text-zinc-500 text-[10px]">Friend Dues</span>
                        <span className="font-bold text-purple-400 text-sm mt-0.5">
                          {fileInfo.duesCount}
                        </span>
                      </div>
                      <div className="p-2 rounded-xl bg-zinc-950 border border-zinc-850 flex flex-col items-center">
                        <span className="text-zinc-500 text-[10px]">Categories</span>
                        <span className="font-bold text-amber-400 text-sm mt-0.5">
                          {fileInfo.categoriesCount}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Mode Selector */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider font-mono">
                      Choose Restore Strategy
                    </label>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <button
                        type="button"
                        onClick={() => setMode("merge")}
                        className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                          mode === "merge"
                            ? "bg-sky-500/10 border-sky-500/40 shadow-[0_0_15px_rgba(56,189,248,0.15)]"
                            : "bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:border-zinc-700"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-zinc-200">
                            Safe Merge (Recommended)
                          </span>
                          <span
                            className={`w-3 h-3 rounded-full border ${
                              mode === "merge"
                                ? "bg-sky-400 border-sky-300"
                                : "border-zinc-600"
                            }`}
                          />
                        </div>
                        <p className="text-[11px] text-zinc-400 mt-1 leading-snug">
                          Keeps existing entries and only imports non-duplicate records.
                        </p>
                      </button>

                      <button
                        type="button"
                        onClick={() => setMode("replace")}
                        className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                          mode === "replace"
                            ? "bg-rose-500/10 border-rose-500/40 shadow-[0_0_15px_rgba(244,63,94,0.15)]"
                            : "bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:border-zinc-700"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-rose-300">
                            Clean Replace (Overwrite)
                          </span>
                          <span
                            className={`w-3 h-3 rounded-full border ${
                              mode === "replace"
                                ? "bg-rose-400 border-rose-300"
                                : "border-zinc-600"
                            }`}
                          />
                        </div>
                        <p className="text-[11px] text-zinc-400 mt-1 leading-snug">
                          Purges current database and resets vault completely to this backup.
                        </p>
                      </button>
                    </div>
                  </div>

                  {/* Replace Confirmation Field */}
                  {mode === "replace" && (
                    <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 space-y-2">
                      <div className="flex items-center gap-2 text-rose-400 text-xs font-bold">
                        <ShieldAlert className="w-4 h-4 flex-shrink-0" />
                        <span>Destructive Action Confirmation</span>
                      </div>
                      <p className="text-[11px] text-rose-300/80 leading-relaxed">
                        To prevent accidental loss of existing records, please type{" "}
                        <strong className="text-white font-mono bg-rose-950/60 px-1 py-0.5 rounded border border-rose-500/30">
                          RESTORE
                        </strong>{" "}
                        below to confirm complete database replacement:
                      </p>
                      <input
                        type="text"
                        value={confirmText}
                        onChange={(e) => setConfirmText(e.target.value)}
                        placeholder="Type RESTORE here"
                        className="w-full px-3 py-2 bg-zinc-900/90 border border-rose-500/40 rounded-lg text-xs font-mono text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-rose-400"
                      />
                    </div>
                  )}
                </div>
              )}

              {/* Error Box */}
              {parseError && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-start gap-2.5 text-xs text-rose-300">
                  <AlertTriangle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
                  <span>{parseError}</span>
                </div>
              )}
            </>
          )}
        </div>

        {/* Modal Footer */}
        {!restoreSuccess && (
          <div className="p-4 sm:p-5 border-t border-zinc-850 flex items-center justify-end gap-2.5 bg-zinc-900/30">
            <button
              onClick={handleClose}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-400 hover:text-zinc-200 hover:bg-zinc-850 transition-colors cursor-pointer"
            >
              Cancel
            </button>

            {fileInfo && (
              <button
                onClick={handleExecuteRestore}
                disabled={
                  isSubmitting ||
                  (mode === "replace" && confirmText.trim().toUpperCase() !== "RESTORE")
                }
                className={`px-5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all cursor-pointer ${
                  mode === "replace"
                    ? "bg-rose-500 hover:bg-rose-400 text-white shadow-[0_0_15px_rgba(244,63,94,0.3)] disabled:opacity-50 disabled:cursor-not-allowed"
                    : "bg-sky-500 hover:bg-sky-400 text-zinc-950 shadow-[0_0_15px_rgba(56,189,248,0.3)] disabled:opacity-50 disabled:cursor-not-allowed"
                }`}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Restoring Vault...</span>
                  </>
                ) : (
                  <>
                    <RotateCcw className="w-4 h-4 stroke-[2.2]" />
                    <span>
                      {mode === "replace" ? "Replace Vault Entirely" : "Safe Merge Restore"}
                    </span>
                  </>
                )}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

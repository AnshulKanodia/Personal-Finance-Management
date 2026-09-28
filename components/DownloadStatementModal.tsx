"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  X,
  Download,
  FileText,
  FileSpreadsheet,
  Calendar,
  Check,
  TrendingDown,
  TrendingUp,
  ReceiptIndianRupee,
  Layers,
  Sparkles,
  Loader2,
  Filter,
} from "lucide-react";
import { formatINR, formatDate } from "@/lib/utils";
import {
  exportStatementToPDF,
  exportStatementToExcel,
  exportStatementToCSV,
  StatementTransaction,
  StatementSummary,
} from "@/lib/statementExporter";

interface Category {
  _id: string;
  name: string;
}

interface DownloadStatementModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories?: Category[];
}

type PeriodType = "MONTH" | "WEEK" | "DAY" | "YEAR" | "CUSTOM";
type ExportFormat = "PDF" | "EXCEL" | "CSV";

export const DownloadStatementModal: React.FC<DownloadStatementModalProps> = ({
  isOpen,
  onClose,
  categories = [],
}) => {
  const now = new Date();
  const currentYearNum = now.getFullYear();
  const currentMonthNum = now.getMonth(); // 0-indexed

  // Format selection
  const [format, setFormat] = useState<ExportFormat>("PDF");

  // Period type
  const [periodType, setPeriodType] = useState<PeriodType>("MONTH");

  // Month selector
  const [selectedMonth, setSelectedMonth] = useState<number>(currentMonthNum);
  const [selectedMonthYear, setSelectedMonthYear] = useState<number>(currentYearNum);

  // Week selector
  const [weekScope, setWeekScope] = useState<"THIS_WEEK" | "LAST_7_DAYS">("THIS_WEEK");

  // Day selector
  const [selectedDay, setSelectedDay] = useState<string>(
    now.toISOString().split("T")[0]
  );

  // Year selector
  const [selectedYear, setSelectedYear] = useState<number>(currentYearNum);

  // Custom range
  const [customStartDate, setCustomStartDate] = useState<string>(() => {
    const d = new Date(now.getFullYear(), now.getMonth(), 1);
    return d.toISOString().split("T")[0];
  });
  const [customEndDate, setCustomEndDate] = useState<string>(
    now.toISOString().split("T")[0]
  );

  // Optional filters
  const [categoryFilter, setCategoryFilter] = useState<string>("ALL");
  const [modeFilter, setModeFilter] = useState<string>("ALL");

  // Data preview state
  const [previewLoading, setPreviewLoading] = useState<boolean>(false);
  const [transactions, setTransactions] = useState<StatementTransaction[]>([]);
  const [summary, setSummary] = useState<StatementSummary | null>(null);
  const [isExporting, setIsExporting] = useState<boolean>(false);

  // Calculate start and end date objects based on selected period
  const getDateRange = useCallback((): { start: Date; end: Date; label: string } => {
    if (periodType === "MONTH") {
      const start = new Date(selectedMonthYear, selectedMonth, 1, 0, 0, 0, 0);
      const end = new Date(selectedMonthYear, selectedMonth + 1, 0, 23, 59, 59, 999);
      const monthLabel = start.toLocaleString("en-IN", { month: "long", year: "numeric" });
      return { start, end, label: monthLabel };
    }

    if (periodType === "WEEK") {
      if (weekScope === "THIS_WEEK") {
        const curr = new Date();
        const first = curr.getDate() - (curr.getDay() === 0 ? 6 : curr.getDay() - 1); // Monday
        const start = new Date(curr.setDate(first));
        start.setHours(0, 0, 0, 0);
        const end = new Date(start);
        end.setDate(start.getDate() + 6);
        end.setHours(23, 59, 59, 999);
        return {
          start,
          end,
          label: `${formatDate(start.toISOString())} - ${formatDate(end.toISOString())}`,
        };
      } else {
        // Last 7 days
        const end = new Date();
        end.setHours(23, 59, 59, 999);
        const start = new Date();
        start.setDate(end.getDate() - 6);
        start.setHours(0, 0, 0, 0);
        return {
          start,
          end,
          label: `Last 7 Days (${formatDate(start.toISOString())} - ${formatDate(end.toISOString())})`,
        };
      }
    }

    if (periodType === "DAY") {
      const [y, m, d] = selectedDay.split("-").map(Number);
      const start = new Date(y, m - 1, d, 0, 0, 0, 0);
      const end = new Date(y, m - 1, d, 23, 59, 59, 999);
      return {
        start,
        end,
        label: start.toLocaleString("en-IN", { dateStyle: "full" }),
      };
    }

    if (periodType === "YEAR") {
      const start = new Date(selectedYear, 0, 1, 0, 0, 0, 0);
      const end = new Date(selectedYear, 11, 31, 23, 59, 59, 999);
      return { start, end, label: `Year ${selectedYear}` };
    }

    // CUSTOM
    const [sy, sm, sd] = customStartDate.split("-").map(Number);
    const [ey, em, ed] = customEndDate.split("-").map(Number);
    const start = new Date(sy, sm - 1, sd, 0, 0, 0, 0);
    const end = new Date(ey, em - 1, ed, 23, 59, 59, 999);
    return {
      start,
      end,
      label: `${formatDate(start.toISOString())} - ${formatDate(end.toISOString())}`,
    };
  }, [
    periodType,
    selectedMonth,
    selectedMonthYear,
    weekScope,
    selectedDay,
    selectedYear,
    customStartDate,
    customEndDate,
  ]);

  // Fetch transactions preview for selected criteria
  const fetchPreviewData = useCallback(async () => {
    if (!isOpen) return;
    try {
      setPreviewLoading(true);
      const { start, end, label } = getDateRange();

      const params = new URLSearchParams();
      params.append("limit", "0"); // fetch all records
      params.append("startDate", start.toISOString());
      params.append("endDate", end.toISOString());

      if (categoryFilter !== "ALL") params.append("category", categoryFilter);
      if (modeFilter !== "ALL") params.append("paymentMode", modeFilter);

      const res = await fetch(`/api/transactions?${params.toString()}`);
      const json = await res.json();

      if (json.success) {
        const txs: StatementTransaction[] = json.data;
        const totalExpense = txs
          .filter((t) => t.type === "EXPENSE")
          .reduce((sum, t) => sum + t.amount, 0);
        const totalIncome = txs
          .filter((t) => t.type === "INCOME")
          .reduce((sum, t) => sum + t.amount, 0);
        const netCashflow = totalIncome - totalExpense;

        setTransactions(txs);
        setSummary({
          periodLabel: label,
          startDate: start.toISOString(),
          endDate: end.toISOString(),
          totalIncome,
          totalExpense,
          netCashflow,
          totalCount: txs.length,
        });
      }
    } catch (e) {
      console.error("Failed to load preview data", e);
    } finally {
      setPreviewLoading(false);
    }
  }, [isOpen, getDateRange, categoryFilter, modeFilter]);

  useEffect(() => {
    if (isOpen) {
      fetchPreviewData();
    }
  }, [isOpen, fetchPreviewData]);

  if (!isOpen) return null;

  const handleDownload = async () => {
    if (!summary || transactions.length === 0) return;
    try {
      setIsExporting(true);
      const sanitizedLabel = summary.periodLabel
        .replace(/[^a-zA-Z0-9_-]/g, "_")
        .replace(/_+/g, "_");

      if (format === "PDF") {
        exportStatementToPDF(
          transactions,
          summary,
          `RupeePulse_Statement_${sanitizedLabel}.pdf`
        );
      } else if (format === "EXCEL") {
        exportStatementToExcel(
          transactions,
          summary,
          `RupeePulse_Statement_${sanitizedLabel}.xlsx`
        );
      } else {
        exportStatementToCSV(
          transactions,
          summary,
          `RupeePulse_Statement_${sanitizedLabel}.csv`
        );
      }
      onClose();
    } catch (e) {
      console.error("Export error", e);
      alert("Failed to export statement. Please try again.");
    } finally {
      setIsExporting(false);
    }
  };

  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
  ];

  const years = [currentYearNum - 2, currentYearNum - 1, currentYearNum, currentYearNum + 1];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-3xl bg-zinc-950 border border-zinc-800/90 shadow-2xl overflow-hidden max-h-[92vh] flex flex-col">
        {/* Top Header */}
        <div className="p-4 sm:p-5 border-b border-zinc-850 flex items-center justify-between bg-zinc-900/40">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600 to-sky-500 p-0.5 flex items-center justify-center shadow-[0_0_15px_rgba(16,185,129,0.25)]">
              <div className="w-full h-full bg-zinc-950 rounded-[10px] flex items-center justify-center">
                <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
              </div>
            </div>
            <div>
              <h3 className="text-base font-bold text-zinc-100 flex items-center gap-2">
                <span>Download Statement</span>
                <span className="text-[10px] px-2 py-0.2 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono">
                  INR Vault
                </span>
              </h3>
              <p className="text-xs text-zinc-400 mt-0.5">
                Generate an official PDF or Excel statement of your transactions
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-zinc-400 hover:text-zinc-200 hover:bg-zinc-850 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-5 space-y-4 overflow-y-auto flex-1 custom-scrollbar">
          {/* 1. Format Selection */}
          <div>
            <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-2">
              1. Select File Format
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setFormat("PDF")}
                className={`p-3 rounded-2xl border text-left transition-all relative flex flex-col justify-between ${
                  format === "PDF"
                    ? "bg-rose-500/10 border-rose-500/50 shadow-[0_0_15px_rgba(244,63,94,0.15)]"
                    : "bg-zinc-900/60 border-zinc-800 hover:border-zinc-700"
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <FileText className={`w-5 h-5 ${format === "PDF" ? "text-rose-400" : "text-zinc-500"}`} />
                  {format === "PDF" && (
                    <div className="w-4 h-4 rounded-full bg-rose-500 text-white flex items-center justify-center">
                      <Check className="w-2.5 h-2.5 stroke-[3]" />
                    </div>
                  )}
                </div>
                <div>
                  <div className="text-xs font-bold text-zinc-100">PDF Document</div>
                  <div className="text-[10px] text-zinc-400 mt-0.5">Official Account Print</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setFormat("EXCEL")}
                className={`p-3 rounded-2xl border text-left transition-all relative flex flex-col justify-between ${
                  format === "EXCEL"
                    ? "bg-emerald-500/10 border-emerald-500/50 shadow-[0_0_15px_rgba(16,185,129,0.15)]"
                    : "bg-zinc-900/60 border-zinc-800 hover:border-zinc-700"
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <FileSpreadsheet className={`w-5 h-5 ${format === "EXCEL" ? "text-emerald-400" : "text-zinc-500"}`} />
                  {format === "EXCEL" && (
                    <div className="w-4 h-4 rounded-full bg-emerald-500 text-zinc-950 flex items-center justify-center">
                      <Check className="w-2.5 h-2.5 stroke-[3]" />
                    </div>
                  )}
                </div>
                <div>
                  <div className="text-xs font-bold text-zinc-100">Excel (.xlsx)</div>
                  <div className="text-[10px] text-zinc-400 mt-0.5">Multi-Sheet Analysis</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setFormat("CSV")}
                className={`p-3 rounded-2xl border text-left transition-all relative flex flex-col justify-between ${
                  format === "CSV"
                    ? "bg-sky-500/10 border-sky-500/50 shadow-[0_0_15px_rgba(14,165,233,0.15)]"
                    : "bg-zinc-900/60 border-zinc-800 hover:border-zinc-700"
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <Layers className={`w-5 h-5 ${format === "CSV" ? "text-sky-400" : "text-zinc-500"}`} />
                  {format === "CSV" && (
                    <div className="w-4 h-4 rounded-full bg-sky-500 text-zinc-950 flex items-center justify-center">
                      <Check className="w-2.5 h-2.5 stroke-[3]" />
                    </div>
                  )}
                </div>
                <div>
                  <div className="text-xs font-bold text-zinc-100">CSV Table</div>
                  <div className="text-[10px] text-zinc-400 mt-0.5">Sheets / Raw Data</div>
                </div>
              </button>
            </div>
          </div>

          {/* 2. Date Range Scope (Month, Week, Day, Year, Custom) */}
          <div>
            <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-2">
              2. Choose Period Scope
            </label>
            <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-zinc-900/80 border border-zinc-800">
              {(["MONTH", "WEEK", "DAY", "YEAR", "CUSTOM"] as PeriodType[]).map((p) => {
                const labels: Record<PeriodType, string> = {
                  MONTH: "Month",
                  WEEK: "Week",
                  DAY: "Day",
                  YEAR: "Year",
                  CUSTOM: "Custom",
                };
                return (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPeriodType(p)}
                    className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-all text-center ${
                      periodType === p
                        ? "bg-zinc-800 text-emerald-400 border border-zinc-700/80 shadow-inner"
                        : "text-zinc-400 hover:text-zinc-200"
                    }`}
                  >
                    {labels[p]}
                  </button>
                );
              })}
            </div>

            {/* Scope Specific Inputs */}
            <div className="mt-3 p-3.5 rounded-2xl bg-zinc-900/40 border border-zinc-850">
              {/* Scope: MONTH */}
              {periodType === "MONTH" && (
                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[11px] font-medium text-zinc-400 mb-1">Month</label>
                    <select
                      value={selectedMonth}
                      onChange={(e) => setSelectedMonth(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-xs font-semibold text-zinc-100 focus:outline-none focus:border-emerald-500/50"
                    >
                      {months.map((m, idx) => (
                        <option key={m} value={idx}>
                          {m}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-zinc-400 mb-1">Year</label>
                    <select
                      value={selectedMonthYear}
                      onChange={(e) => setSelectedMonthYear(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-xs font-semibold text-zinc-100 focus:outline-none focus:border-emerald-500/50"
                    >
                      {years.map((y) => (
                        <option key={y} value={y}>
                          {y}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {/* Scope: WEEK */}
              {periodType === "WEEK" && (
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setWeekScope("THIS_WEEK")}
                    className={`p-2.5 rounded-xl border text-xs font-bold transition-all text-center ${
                      weekScope === "THIS_WEEK"
                        ? "bg-emerald-500/10 border-emerald-500/40 text-emerald-300"
                        : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-700"
                    }`}
                  >
                    Current Week (Mon - Sun)
                  </button>
                  <button
                    type="button"
                    onClick={() => setWeekScope("LAST_7_DAYS")}
                    className={`p-2.5 rounded-xl border text-xs font-bold transition-all text-center ${
                      weekScope === "LAST_7_DAYS"
                        ? "bg-emerald-500/10 border-emerald-500/40 text-emerald-300"
                        : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-700"
                    }`}
                  >
                    Rolling Last 7 Days
                  </button>
                </div>
              )}

              {/* Scope: DAY */}
              {periodType === "DAY" && (
                <div>
                  <label className="block text-[11px] font-medium text-zinc-400 mb-1">
                    Select Target Date
                  </label>
                  <input
                    type="date"
                    value={selectedDay}
                    onChange={(e) => setSelectedDay(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-xs font-semibold text-zinc-100 focus:outline-none focus:border-emerald-500/50"
                  />
                </div>
              )}

              {/* Scope: YEAR */}
              {periodType === "YEAR" && (
                <div>
                  <label className="block text-[11px] font-medium text-zinc-400 mb-1">
                    Select Calendar Year
                  </label>
                  <select
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-xs font-semibold text-zinc-100 focus:outline-none focus:border-emerald-500/50"
                  >
                    {years.map((y) => (
                      <option key={y} value={y}>
                        Full Year {y} (Jan 1 - Dec 31)
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Scope: CUSTOM */}
              {periodType === "CUSTOM" && (
                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[11px] font-medium text-zinc-400 mb-1">From Date</label>
                    <input
                      type="date"
                      value={customStartDate}
                      onChange={(e) => setCustomStartDate(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-xs font-semibold text-zinc-100 focus:outline-none focus:border-emerald-500/50"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-zinc-400 mb-1">To Date</label>
                    <input
                      type="date"
                      value={customEndDate}
                      onChange={(e) => setCustomEndDate(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-xs font-semibold text-zinc-100 focus:outline-none focus:border-emerald-500/50"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 3. Optional Filter Narrowing (Category & Mode) */}
          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="block text-[11px] font-medium text-zinc-400 mb-1">Category (Optional)</label>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-xs font-semibold text-zinc-300 focus:outline-none focus:border-emerald-500/50"
              >
                <option value="ALL">All Categories</option>
                {categories.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-medium text-zinc-400 mb-1">Payment Mode (Optional)</label>
              <select
                value={modeFilter}
                onChange={(e) => setModeFilter(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-xs font-semibold text-zinc-300 focus:outline-none focus:border-emerald-500/50"
              >
                <option value="ALL">All Payment Channels</option>
                <option value="UPI">UPI</option>
                <option value="CASH">Cash</option>
                <option value="CARD">Card</option>
                <option value="NET_BANKING">Net Banking</option>
              </select>
            </div>
          </div>

          {/* 4. Live Statement Metrics Preview Card */}
          <div className="p-3.5 sm:p-4 rounded-2xl bg-zinc-900/70 border border-zinc-800 relative overflow-hidden">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] uppercase tracking-wider text-zinc-500 font-bold">
                Statement Data Preview
              </span>
              {previewLoading ? (
                <div className="flex items-center gap-1 text-[10px] text-emerald-400">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  <span>Loading records...</span>
                </div>
              ) : (
                <span className="text-[11px] font-mono text-emerald-400 font-bold">
                  {summary ? `${summary.totalCount} transactions found` : "0 records"}
                </span>
              )}
            </div>

            {summary ? (
              <div className="grid grid-cols-3 gap-2 text-center pt-1 border-t border-zinc-850">
                <div>
                  <span className="text-[10px] text-zinc-500 block">Total Outflow</span>
                  <span className="text-xs sm:text-sm font-black font-mono text-rose-400">
                    -{formatINR(summary.totalExpense)}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-zinc-500 block">Total Inflow</span>
                  <span className="text-xs sm:text-sm font-black font-mono text-emerald-400">
                    +{formatINR(summary.totalIncome)}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-zinc-500 block">Net Flow</span>
                  <span
                    className={`text-xs sm:text-sm font-black font-mono ${
                      summary.netCashflow >= 0 ? "text-emerald-400" : "text-rose-400"
                    }`}
                  >
                    {summary.netCashflow >= 0 ? "+" : ""}
                    {formatINR(summary.netCashflow)}
                  </span>
                </div>
              </div>
            ) : null}
          </div>
        </div>

        {/* Modal Footer / Download Action */}
        <div className="p-4 sm:p-5 border-t border-zinc-850 bg-zinc-900/30 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-zinc-800 text-xs font-semibold text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900 transition-colors"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleDownload}
            disabled={previewLoading || isExporting || transactions.length === 0}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-sky-400 hover:from-emerald-400 hover:to-sky-300 text-zinc-950 font-bold text-xs sm:text-sm shadow-[0_0_20px_rgba(16,185,129,0.3)] transition-all active:scale-95 disabled:opacity-40 disabled:pointer-events-none"
          >
            {isExporting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Generating {format}...</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4 stroke-[2.5]" />
                <span>Download {format === "PDF" ? "PDF Statement" : format === "EXCEL" ? "Excel Spreadsheet" : "CSV Statement"}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

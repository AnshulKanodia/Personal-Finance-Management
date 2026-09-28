import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import { formatINR, formatDate } from "./utils";

export interface StatementTransaction {
  _id: string;
  date: string;
  type: "EXPENSE" | "INCOME";
  paymentMode: "UPI" | "CASH" | "CARD" | "NET_BANKING" | string;
  category?: {
    name?: string;
    color?: string;
    icon?: string;
  } | string;
  amount: number;
  notes?: string;
}

export interface StatementSummary {
  periodLabel: string;
  startDate?: string;
  endDate?: string;
  totalIncome: number;
  totalExpense: number;
  netCashflow: number;
  totalCount: number;
}

function getCategoryName(tx: StatementTransaction): string {
  if (!tx.category) return "Uncategorized";
  if (typeof tx.category === "string") return tx.category;
  return tx.category.name || "Uncategorized";
}

function formatPaymentMode(mode: string): string {
  switch (mode) {
    case "NET_BANKING":
      return "Net Banking";
    case "UPI":
      return "UPI";
    case "CASH":
      return "Cash";
    case "CARD":
      return "Card";
    default:
      return mode || "UPI";
  }
}

/**
 * Generates an executive-grade, professional PDF account statement
 */
export function exportStatementToPDF(
  transactions: StatementTransaction[],
  summary: StatementSummary,
  filename?: string
): void {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // 1. Top Decorative Brand Bar
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(0, 0, pageWidth, 38, "F");

  // Accent Line (Emerald)
  doc.setFillColor(16, 185, 129); // emerald-500
  doc.rect(0, 37, pageWidth, 1.5, "F");

  // Brand Name & Title
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text("RupeePulse Financial Vault", 14, 16);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(148, 163, 184); // slate-400
  doc.text("Personal Income & Expenditure Account Statement", 14, 23);
  doc.text(`Generated: ${new Date().toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}`, 14, 29);

  // Period Badge on top right
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(52, 211, 153); // emerald-400
  doc.text(`Period: ${summary.periodLabel}`, pageWidth - 14, 18, { align: "right" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(148, 163, 184);
  doc.text(`Confidential • Single-User Vault`, pageWidth - 14, 25, { align: "right" });

  // 2. Executive 4-Metric Summary Cards
  const cardY = 44;
  const cardHeight = 18;
  const marginX = 14;
  const gap = 3.5;
  const cardWidth = (pageWidth - marginX * 2 - gap * 3) / 4;

  const cards = [
    {
      title: "TOTAL INFLOW",
      value: `Rs. ${summary.totalIncome.toLocaleString("en-IN")}`,
      color: [5, 150, 105], // emerald-600
      bg: [236, 253, 245], // emerald-50
      border: [167, 243, 208],
    },
    {
      title: "TOTAL OUTFLOW",
      value: `Rs. ${summary.totalExpense.toLocaleString("en-IN")}`,
      color: [225, 29, 72], // rose-600
      bg: [255, 241, 242], // rose-50
      border: [254, 205, 211],
    },
    {
      title: "NET CASHFLOW",
      value: `${summary.netCashflow >= 0 ? "+" : "-"}Rs. ${Math.abs(summary.netCashflow).toLocaleString("en-IN")}`,
      color: summary.netCashflow >= 0 ? [5, 150, 105] : [225, 29, 72],
      bg: summary.netCashflow >= 0 ? [236, 253, 245] : [255, 241, 242],
      border: summary.netCashflow >= 0 ? [167, 243, 208] : [254, 205, 211],
    },
    {
      title: "TRANSACTIONS",
      value: `${summary.totalCount} records`,
      color: [15, 23, 42], // slate-900
      bg: [248, 250, 252], // slate-50
      border: [226, 232, 240],
    },
  ];

  cards.forEach((c, i) => {
    const x = marginX + i * (cardWidth + gap);
    // Card background
    doc.setFillColor(c.bg[0], c.bg[1], c.bg[2]);
    doc.setDrawColor(c.border[0], c.border[1], c.border[2]);
    doc.roundedRect(x, cardY, cardWidth, cardHeight, 2, 2, "FD");

    // Title
    doc.setFont("helvetica", "bold");
    doc.setFontSize(6.5);
    doc.setTextColor(100, 116, 139); // slate-500
    doc.text(c.title, x + 3.5, cardY + 6);

    // Value
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.setTextColor(c.color[0], c.color[1], c.color[2]);
    doc.text(c.value, x + 3.5, cardY + 13);
  });

  // 3. Transactions Table
  const tableData = transactions.map((t) => {
    const isExpense = t.type === "EXPENSE";
    const dateFormatted = formatDate(t.date);
    const category = getCategoryName(t);
    const mode = formatPaymentMode(t.paymentMode);
    const debit = isExpense ? `Rs. ${t.amount.toLocaleString("en-IN")}` : "-";
    const credit = !isExpense ? `Rs. ${t.amount.toLocaleString("en-IN")}` : "-";
    const notes = t.notes ? t.notes.trim() : "-";

    return [dateFormatted, category, mode, isExpense ? "Expense" : "Income", debit, credit, notes];
  });

  const autoTableFn = (autoTable as any).default || autoTable;

  autoTableFn(doc, {
    startY: 68,
    head: [["Date", "Category", "Payment Mode", "Type", "Debit (Out)", "Credit (In)", "Notes / Reason"]],
    body: tableData,
    theme: "striped",
    margin: { left: 14, right: 14, bottom: 20 },
    styles: {
      fontSize: 8,
      cellPadding: 2.2,
      font: "helvetica",
      textColor: [30, 41, 59], // slate-800
      lineColor: [226, 232, 240],
      lineWidth: 0.1,
    },
    headStyles: {
      fillColor: [15, 23, 42], // slate-900
      textColor: [255, 255, 255],
      fontStyle: "bold",
      fontSize: 8,
      halign: "left",
    },
    columnStyles: {
      0: { cellWidth: 24, fontStyle: "normal" }, // Date
      1: { cellWidth: 26, fontStyle: "bold" },   // Category
      2: { cellWidth: 23 },                     // Mode
      3: { cellWidth: 17 },                     // Type
      4: { cellWidth: 24, halign: "right", textColor: [225, 29, 72] }, // Debit
      5: { cellWidth: 24, halign: "right", textColor: [5, 150, 105] }, // Credit
      6: { cellWidth: "auto" },                 // Notes
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252], // slate-50
    },
    didDrawPage: (data: any) => {
      // Footer on every page
      const current = data.pageNumber;
      const total = doc.getNumberOfPages();
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7.5);
      doc.setTextColor(148, 163, 184);

      // Line above footer
      doc.setDrawColor(226, 232, 240);
      doc.line(14, pageHeight - 12, pageWidth - 14, pageHeight - 12);

      doc.text("RupeePulse Vault • Encrypted Ledger Audit Statement", 14, pageHeight - 7);
      doc.text(`Page ${current} of ${total}`, pageWidth - 14, pageHeight - 7, { align: "right" });
    },
  });

  const finalName = filename || `RupeePulse_Statement_${summary.periodLabel.replace(/\s+/g, "_")}.pdf`;
  doc.save(finalName);
}

/**
 * Generates an Excel spreadsheet (.xlsx) with:
 * - Detailed account transaction movement
 * - Category spending breakdown
 * - Payment channel analysis
 */
export function exportStatementToExcel(
  transactions: StatementTransaction[],
  summary: StatementSummary,
  filename?: string
): void {
  const wb = XLSX.utils.book_new();

  // 1. Main Transactions Worksheet
  const sheetRows: any[] = [
    ["RupeePulse Financial Statement"],
    [`Statement Period: ${summary.periodLabel}`],
    [`Generated On: ${new Date().toLocaleString("en-IN")}`],
    [],
    [
      `Total Income: Rs. ${summary.totalIncome.toLocaleString("en-IN")}`,
      `Total Expense: Rs. ${summary.totalExpense.toLocaleString("en-IN")}`,
      `Net Cashflow: Rs. ${summary.netCashflow.toLocaleString("en-IN")}`,
      `Total Count: ${summary.totalCount} records`,
    ],
    [],
    ["Date", "Type", "Category", "Payment Mode", "Debit (Expense)", "Credit (Income)", "Amount (INR)", "Notes / Reason"],
  ];

  transactions.forEach((tx) => {
    const isExpense = tx.type === "EXPENSE";
    const debit = isExpense ? tx.amount : 0;
    const credit = !isExpense ? tx.amount : 0;
    sheetRows.push([
      formatDate(tx.date),
      tx.type,
      getCategoryName(tx),
      formatPaymentMode(tx.paymentMode),
      debit > 0 ? debit : "",
      credit > 0 ? credit : "",
      tx.amount,
      tx.notes || "",
    ]);
  });

  // Add Summary Total Row
  sheetRows.push([]);
  sheetRows.push([
    "TOTAL",
    "",
    "",
    "",
    summary.totalExpense,
    summary.totalIncome,
    summary.netCashflow,
    "",
  ]);

  const ws = XLSX.utils.aoa_to_sheet(sheetRows);

  // Set column widths
  ws["!cols"] = [
    { wch: 14 }, // Date
    { wch: 12 }, // Type
    { wch: 18 }, // Category
    { wch: 15 }, // Payment Mode
    { wch: 16 }, // Debit
    { wch: 16 }, // Credit
    { wch: 16 }, // Amount
    { wch: 35 }, // Notes
  ];

  XLSX.utils.book_append_sheet(wb, ws, "Transactions Statement");

  // 2. Category Breakdown Sheet
  const categoryTotals: Record<string, { total: number; count: number; type: string }> = {};
  transactions.forEach((tx) => {
    const cat = getCategoryName(tx);
    if (!categoryTotals[cat]) {
      categoryTotals[cat] = { total: 0, count: 0, type: tx.type };
    }
    categoryTotals[cat].total += tx.amount;
    categoryTotals[cat].count += 1;
  });

  const catRows: any[] = [
    ["Category Breakdown"],
    [`Period: ${summary.periodLabel}`],
    [],
    ["Category Name", "Type", "Total Volume (INR)", "Count", "% of Total Volume"],
  ];

  const grandTotal = summary.totalExpense + summary.totalIncome || 1;
  Object.entries(categoryTotals)
    .sort((a, b) => b[1].total - a[1].total)
    .forEach(([cat, stat]) => {
      const pct = ((stat.total / grandTotal) * 100).toFixed(1) + "%";
      catRows.push([cat, stat.type, stat.total, stat.count, pct]);
    });

  const wsCat = XLSX.utils.aoa_to_sheet(catRows);
  wsCat["!cols"] = [{ wch: 22 }, { wch: 12 }, { wch: 20 }, { wch: 10 }, { wch: 16 }];
  XLSX.utils.book_append_sheet(wb, wsCat, "Category Breakdown");

  // 3. Payment Mode Breakdown Sheet
  const modeTotals: Record<string, { total: number; count: number }> = {};
  transactions.forEach((tx) => {
    const mode = formatPaymentMode(tx.paymentMode);
    if (!modeTotals[mode]) {
      modeTotals[mode] = { total: 0, count: 0 };
    }
    modeTotals[mode].total += tx.amount;
    modeTotals[mode].count += 1;
  });

  const modeRows: any[] = [
    ["Payment Channel Breakdown"],
    [`Period: ${summary.periodLabel}`],
    [],
    ["Payment Mode", "Total Volume (INR)", "Transaction Count", "% of Volume"],
  ];

  Object.entries(modeTotals)
    .sort((a, b) => b[1].total - a[1].total)
    .forEach(([mode, stat]) => {
      const pct = ((stat.total / grandTotal) * 100).toFixed(1) + "%";
      modeRows.push([mode, stat.total, stat.count, pct]);
    });

  const wsMode = XLSX.utils.aoa_to_sheet(modeRows);
  wsMode["!cols"] = [{ wch: 18 }, { wch: 20 }, { wch: 18 }, { wch: 14 }];
  XLSX.utils.book_append_sheet(wb, wsMode, "Payment Channels");

  const finalName = filename || `RupeePulse_Statement_${summary.periodLabel.replace(/\s+/g, "_")}.xlsx`;
  XLSX.writeFile(wb, finalName);
}

/**
 * Generates a clean UTF-8 CSV statement
 */
export function exportStatementToCSV(
  transactions: StatementTransaction[],
  summary: StatementSummary,
  filename?: string
): void {
  const headers = ["Date", "Type", "Category", "Payment Mode", "Debit (Expense)", "Credit (Income)", "Amount (INR)", "Notes / Reason"];
  const rows = transactions.map((tx) => {
    const isExpense = tx.type === "EXPENSE";
    const debit = isExpense ? tx.amount : "";
    const credit = !isExpense ? tx.amount : "";
    const cleanNotes = (tx.notes || "").replace(/"/g, '""');
    return [
      `"${formatDate(tx.date)}"`,
      `"${tx.type}"`,
      `"${getCategoryName(tx).replace(/"/g, '""')}"`,
      `"${formatPaymentMode(tx.paymentMode)}"`,
      debit,
      credit,
      tx.amount,
      `"${cleanNotes}"`,
    ].join(",");
  });

  const csvContent = "\uFEFF" + [headers.join(","), ...rows].join("\r\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename || `RupeePulse_Statement_${summary.periodLabel.replace(/\s+/g, "_")}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

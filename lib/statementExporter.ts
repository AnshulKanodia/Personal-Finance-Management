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

const EMOJI_MAP: Record<string, string> = {
  // Food & Dining
  "🍕": "[Pizza]",
  "🍔": "[Burger]",
  "🍟": "[Fries]",
  "🌭": "[Hotdog]",
  "🥪": "[Sandwich]",
  "🌮": "[Taco]",
  "🌯": "[Burrito]",
  "🍜": "[Noodles]",
  "🍝": "[Pasta]",
  "🍛": "[Curry]",
  "🍚": "[Rice]",
  "🍱": "[Lunchbox]",
  "🍣": "[Sushi]",
  "🍲": "[Pot]",
  "🥘": "[Pan]",
  "🥣": "[Soup]",
  "🥗": "[Salad]",
  "🍿": "[Popcorn]",
  "🍩": "[Donut]",
  "🍪": "[Cookie]",
  "🎂": "[Cake]",
  "🍰": "[Pastry]",
  "🧁": "[Cupcake]",
  "🍫": "[Chocolate]",
  "🍬": "[Candy]",
  "🍦": "[Ice Cream]",
  "🍨": "[Ice Cream]",
  "☕": "[Coffee]",
  "🍵": "[Chai/Tea]",
  "🧋": "[Boba/Tea]",
  "🥤": "[Drink]",
  "🍻": "[Beer]",
  "🍺": "[Beer]",
  "🍷": "[Wine]",
  "🍸": "[Cocktail]",
  "🍹": "[Juice]",
  "🍾": "[Champagne]",
  "🍼": "[Milk]",
  "🍽️": "[Dining]",
  "🍴": "[Dining]",

  // Transport & Fuel
  "🚕": "[Cab]",
  "🚖": "[Cab]",
  "🚗": "[Car]",
  "🚘": "[Car]",
  "🚙": "[SUV]",
  "🏎️": "[Car]",
  "🚌": "[Bus]",
  "🚎": "[Bus]",
  "🚐": "[Van]",
  "🚑": "[Ambulance]",
  "🚓": "[Police]",
  "🚒": "[Fire]",
  "🚚": "[Truck]",
  "🚛": "[Lorry]",
  "🚜": "[Tractor]",
  "🛵": "[Scooter]",
  "🏍️": "[Bike]",
  "🚲": "[Cycle]",
  "🛴": "[Scooter]",
  "⛽": "[Fuel/Petrol]",
  "🚆": "[Train]",
  "🚇": "[Metro]",
  "🚄": "[Train]",
  "🚅": "[Train]",
  "🚂": "[Train]",
  "✈️": "[Flight]",
  "🛫": "[Flight]",
  "🛬": "[Flight]",
  "🚁": "[Helicopter]",
  "🚢": "[Ship]",
  "🛳️": "[Cruise]",
  "🚤": "[Boat]",
  "🧳": "[Luggage]",
  "🎫": "[Ticket]",
  "🎟️": "[Pass]",

  // Shopping & Groceries
  "🛒": "[Groceries]",
  "🛍️": "[Shopping]",
  "👕": "[Clothes]",
  "👔": "[Shirt]",
  "👗": "[Dress]",
  "👖": "[Jeans]",
  "👟": "[Shoes]",
  "👠": "[Shoes]",
  "👜": "[Bag]",
  "🎒": "[Backpack]",
  "📦": "[Delivery]",
  "🏷️": "[Tag]",
  "👓": "[Glasses]",
  "🕶️": "[Sunglasses]",

  // Home & Utilities
  "🏠": "[Rent/Home]",
  "🏡": "[Home]",
  "🏢": "[Office]",
  "🏬": "[Store]",
  "💡": "[Electricity]",
  "🔌": "[Power]",
  "💧": "[Water]",
  "🚿": "[Bath]",
  "📶": "[Internet]",
  "🌐": "[Wifi]",
  "📱": "[Mobile/Recharge]",
  "💻": "[Laptop]",
  "🖥️": "[PC]",
  "🖨️": "[Print]",
  "📺": "[TV]",
  "📻": "[Radio]",
  "🛠️": "[Repairs]",
  "🔧": "[Tools]",
  "🔨": "[Hammer]",
  "🧹": "[Cleaning]",
  "🧺": "[Laundry]",

  // Health & Care
  "💊": "[Medicine]",
  "💉": "[Vaccine]",
  "🩺": "[Doctor]",
  "🏥": "[Hospital]",
  "🩹": "[Bandage]",
  "🩸": "[Blood]",
  "🦷": "[Dental]",
  "🏋️": "[Gym]",
  "🧘": "[Yoga]",
  "🏃": "[Running]",
  "🏊": "[Swim]",
  "💇": "[Salon/Haircut]",
  "💅": "[Nails]",
  "🧴": "[Lotion]",

  // Entertainment
  "🎬": "[Movie]",
  "🎥": "[Cinema]",
  "📽️": "[Film]",
  "🎭": "[Theater]",
  "🎨": "[Art]",
  "🎪": "[Circus]",
  "🎤": "[Karaoke]",
  "🎧": "[Music]",
  "🎼": "[Music]",
  "🎹": "[Piano]",
  "🎸": "[Guitar]",
  "🎺": "[Music]",
  "🎻": "[Violin]",
  "🥁": "[Drums]",
  "🎮": "[Gaming]",
  "🕹️": "[Game]",
  "🎲": "[Dice]",
  "♟️": "[Chess]",
  "🎳": "[Bowling]",

  // Money & Business
  "💰": "[Money]",
  "💵": "[Cash]",
  "💸": "[Spent]",
  "💳": "[Card]",
  "🪙": "[Coins]",
  "🏦": "[Bank]",
  "🏧": "[ATM]",
  "🧾": "[Receipt/Bill]",
  "📈": "[Invest]",
  "📉": "[Loss]",
  "📊": "[Stats]",
  "💎": "[Jewelry]",
  "💼": "[Work]",

  // Social & Celebrations
  "🎁": "[Gift]",
  "🎉": "[Celebration]",
  "🎊": "[Party]",
  "🎈": "[Balloon]",
  "💐": "[Flowers]",
  "🌹": "[Rose]",
  "⭐": "[Star]",
  "🌟": "[Star]",
  "✨": "[Sparkle]",
  "❤️": "[Heart]",
  "✔️": "[Done]",
  "✅": "[Verified]",
  "❌": "[Cancelled]",
};

/**
 * Converts emojis into clean, human-readable labels for standard Helvetica PDF fonts
 * so text doesn't vanish into whitespace or broken characters in PDF readers.
 */
export function formatNotesForPDF(notes?: string): string {
  if (!notes) return "-";
  let text = notes.trim();
  if (!text) return "-";

  // Replace mapped emojis with clean descriptive tags
  for (const [emoji, label] of Object.entries(EMOJI_MAP)) {
    if (text.includes(emoji)) {
      text = text.replaceAll(emoji, ` ${label} `);
    }
  }

  // Any remaining unmapped Unicode emojis & symbols
  text = text.replace(/[\uD800-\uDBFF][\uDC00-\uDFFF]|[\u2600-\u27BF]/g, " [Note] ");

  // Collapse multiple whitespaces and trim
  text = text.replace(/\s+/g, " ").trim();

  return text || "-";
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
    const notes = formatNotesForPDF(t.notes);

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

export interface LedgerDueItem {
  _id: string;
  date: string;
  friendId?: {
    _id?: string;
    name: string;
    phone?: string;
  } | string;
  type: "TO_GIVE" | "TO_TAKE";
  amount: number;
  paymentMode: "UPI" | "CASH" | string;
  notes?: string;
  isSettled: boolean;
  settledAt?: string;
}

export interface LedgerSummary {
  periodLabel: string;
  friendName: string;
  totalToTake: number;
  totalToGive: number;
  netBalance: number;
  totalCount: number;
  unsettledCount: number;
  settledCount: number;
}

function getFriendName(due: LedgerDueItem): string {
  if (!due.friendId) return "Unknown";
  if (typeof due.friendId === "string") return due.friendId;
  return due.friendId.name || "Unknown";
}

/**
 * Generates an executive-grade PDF statement for Friend Ledger Passbook
 */
export function exportLedgerStatementToPDF(
  dues: LedgerDueItem[],
  summary: LedgerSummary,
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

  // Accent Line (Emerald & Sky gradient feel)
  doc.setFillColor(14, 165, 233); // sky-500
  doc.rect(0, 37, pageWidth, 1.5, "F");

  // Brand Name & Title
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text("RupeePulse Friend Ledger", 14, 16);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(148, 163, 184); // slate-400
  doc.text(`Bilateral Passbook Statement • Contact: ${summary.friendName}`, 14, 23);
  doc.text(`Generated: ${new Date().toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}`, 14, 29);

  // Period Badge on top right
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(56, 189, 248); // sky-400
  doc.text(`Period: ${summary.periodLabel}`, pageWidth - 14, 18, { align: "right" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(148, 163, 184);
  doc.text(`Passbook Audit • Bilateral Account`, pageWidth - 14, 25, { align: "right" });

  // 2. Executive 4-Metric Summary Cards
  const cardY = 44;
  const cardHeight = 18;
  const marginX = 14;
  const gap = 3.5;
  const cardWidth = (pageWidth - marginX * 2 - gap * 3) / 4;

  const cards = [
    {
      title: "TOTAL TO TAKE (+)",
      value: `Rs. ${summary.totalToTake.toLocaleString("en-IN")}`,
      color: [5, 150, 105], // emerald-600
      bg: [236, 253, 245], // emerald-50
      border: [167, 243, 208],
    },
    {
      title: "TOTAL TO GIVE (-)",
      value: `Rs. ${summary.totalToGive.toLocaleString("en-IN")}`,
      color: [225, 29, 72], // rose-600
      bg: [255, 241, 242], // rose-50
      border: [254, 205, 211],
    },
    {
      title: "NET POSITION",
      value: `${summary.netBalance >= 0 ? "+" : "-"}Rs. ${Math.abs(summary.netBalance).toLocaleString("en-IN")}`,
      color: summary.netBalance >= 0 ? [5, 150, 105] : [225, 29, 72],
      bg: summary.netBalance >= 0 ? [236, 253, 245] : [255, 241, 242],
      border: summary.netBalance >= 0 ? [167, 243, 208] : [254, 205, 211],
    },
    {
      title: "LINE ENTRIES",
      value: `${summary.totalCount} (${summary.unsettledCount} active)`,
      color: [15, 23, 42],
      bg: [248, 250, 252],
      border: [226, 232, 240],
    },
  ];

  cards.forEach((c, i) => {
    const x = marginX + i * (cardWidth + gap);
    doc.setFillColor(c.bg[0], c.bg[1], c.bg[2]);
    doc.setDrawColor(c.border[0], c.border[1], c.border[2]);
    doc.roundedRect(x, cardY, cardWidth, cardHeight, 2, 2, "FD");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(6.5);
    doc.setTextColor(100, 116, 139);
    doc.text(c.title, x + 3.5, cardY + 6);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.setTextColor(c.color[0], c.color[1], c.color[2]);
    doc.text(c.value, x + 3.5, cardY + 13);
  });

  // 3. Ledger Table
  const tableData = dues.map((d) => {
    const isTake = d.type === "TO_TAKE";
    const dateFormatted = formatDate(d.date);
    const friend = getFriendName(d);
    const mode = formatPaymentMode(d.paymentMode);
    const action = isTake ? "You Lent / Spent (+)" : "Friend Deposited (-)";
    const toTakeAmt = isTake ? `Rs. ${d.amount.toLocaleString("en-IN")}` : "-";
    const toGiveAmt = !isTake ? `Rs. ${d.amount.toLocaleString("en-IN")}` : "-";
    const status = d.isSettled ? "Settled" : "Active";
    const notes = formatNotesForPDF(d.notes);

    return [dateFormatted, friend, action, mode, toTakeAmt, toGiveAmt, status, notes];
  });

  const autoTableFn = (autoTable as any).default || autoTable;

  autoTableFn(doc, {
    startY: 68,
    head: [["Date", "Contact", "Action / Type", "Channel", "To Take (+)", "To Give (-)", "Status", "Notes / Purpose"]],
    body: tableData,
    theme: "striped",
    margin: { left: 14, right: 14, bottom: 20 },
    styles: {
      fontSize: 8,
      cellPadding: 2.2,
      font: "helvetica",
      textColor: [30, 41, 59],
      lineColor: [226, 232, 240],
      lineWidth: 0.1,
    },
    headStyles: {
      fillColor: [15, 23, 42],
      textColor: [255, 255, 255],
      fontStyle: "bold",
      fontSize: 8,
      halign: "left",
    },
    columnStyles: {
      0: { cellWidth: 22 }, // Date
      1: { cellWidth: 22, fontStyle: "bold" }, // Contact
      2: { cellWidth: 28 }, // Action
      3: { cellWidth: 16 }, // Channel
      4: { cellWidth: 22, halign: "right", textColor: [5, 150, 105] }, // To Take
      5: { cellWidth: 22, halign: "right", textColor: [225, 29, 72] }, // To Give
      6: { cellWidth: 16, halign: "center" }, // Status
      7: { cellWidth: "auto" }, // Notes
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    didDrawPage: (data: any) => {
      const current = data.pageNumber;
      const total = doc.getNumberOfPages();
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7.5);
      doc.setTextColor(148, 163, 184);

      doc.setDrawColor(226, 232, 240);
      doc.line(14, pageHeight - 12, pageWidth - 14, pageHeight - 12);

      doc.text("RupeePulse Vault • Bilateral Friend Ledger Audit Statement", 14, pageHeight - 7);
      doc.text(`Page ${current} of ${total}`, pageWidth - 14, pageHeight - 7, { align: "right" });
    },
  });

  const finalName = filename || `RupeePulse_Ledger_${summary.friendName.replace(/\s+/g, "_")}.pdf`;
  doc.save(finalName);
}

/**
 * Generates an Excel spreadsheet (.xlsx) for Friend Ledger
 */
export function exportLedgerStatementToExcel(
  dues: LedgerDueItem[],
  summary: LedgerSummary,
  filename?: string
): void {
  const wb = XLSX.utils.book_new();

  // Sheet 1: Ledger Entries
  const sheetRows: any[] = [
    ["RupeePulse Friend Ledger Statement"],
    [`Contact: ${summary.friendName}`],
    [`Period: ${summary.periodLabel}`],
    [`Generated: ${new Date().toLocaleString("en-IN")}`],
    [
      `Total To Take: Rs. ${summary.totalToTake}`,
      `Total To Give: Rs. ${summary.totalToGive}`,
      `Net Position: Rs. ${summary.netBalance}`,
      `Total Records: ${summary.totalCount}`,
    ],
    [],
    ["Date", "Contact", "Action", "Payment Mode", "To Take (Owed to You)", "To Give (You Owe)", "Amount (INR)", "Status", "Settled Date", "Notes / Purpose"],
  ];

  dues.forEach((d) => {
    const isTake = d.type === "TO_TAKE";
    sheetRows.push([
      formatDate(d.date),
      getFriendName(d),
      isTake ? "You Lent / Spent" : "Friend Deposited",
      formatPaymentMode(d.paymentMode),
      isTake ? d.amount : "",
      !isTake ? d.amount : "",
      d.amount,
      d.isSettled ? "Settled" : "Active",
      d.settledAt ? formatDate(d.settledAt) : "-",
      d.notes || "",
    ]);
  });

  // Summary Total Row
  sheetRows.push([]);
  sheetRows.push([
    "TOTAL",
    "",
    "",
    "",
    summary.totalToTake,
    summary.totalToGive,
    summary.netBalance,
    "",
    "",
    "",
  ]);

  const ws = XLSX.utils.aoa_to_sheet(sheetRows);
  ws["!cols"] = [
    { wch: 14 }, // Date
    { wch: 18 }, // Contact
    { wch: 20 }, // Action
    { wch: 15 }, // Payment Mode
    { wch: 18 }, // To Take
    { wch: 18 }, // To Give
    { wch: 16 }, // Amount
    { wch: 12 }, // Status
    { wch: 14 }, // Settled Date
    { wch: 35 }, // Notes
  ];

  XLSX.utils.book_append_sheet(wb, ws, "Ledger Passbook");

  // Sheet 2: Friend Reconciliation Summary
  const friendStats: Record<string, { toTake: number; toGive: number; count: number }> = {};
  dues.forEach((d) => {
    const fName = getFriendName(d);
    if (!friendStats[fName]) friendStats[fName] = { toTake: 0, toGive: 0, count: 0 };
    if (d.type === "TO_TAKE") friendStats[fName].toTake += d.amount;
    else friendStats[fName].toGive += d.amount;
    friendStats[fName].count += 1;
  });

  const reconRows: any[] = [
    ["Friend Passbook Reconciliation Summary"],
    [`Period: ${summary.periodLabel}`],
    [],
    ["Friend Name", "Total To Take (INR)", "Total To Give (INR)", "Net Balance (INR)", "Status", "Total Entries"],
  ];

  Object.entries(friendStats).forEach(([name, stat]) => {
    const net = stat.toTake - stat.toGive;
    const status = net > 0 ? "Owes You" : net < 0 ? "You Owe" : "All Squared Off";
    reconRows.push([name, stat.toTake, stat.toGive, net, status, stat.count]);
  });

  const wsRecon = XLSX.utils.aoa_to_sheet(reconRows);
  wsRecon["!cols"] = [{ wch: 20 }, { wch: 20 }, { wch: 20 }, { wch: 20 }, { wch: 18 }, { wch: 14 }];
  XLSX.utils.book_append_sheet(wb, wsRecon, "Reconciliation");

  const finalName = filename || `RupeePulse_Ledger_${summary.friendName.replace(/\s+/g, "_")}.xlsx`;
  XLSX.writeFile(wb, finalName);
}

/**
 * Generates a clean UTF-8 CSV statement for Friend Ledger
 */
export function exportLedgerStatementToCSV(
  dues: LedgerDueItem[],
  summary: LedgerSummary,
  filename?: string
): void {
  const headers = ["Date", "Contact", "Action", "Payment Mode", "To Take (Owed to You)", "To Give (You Owe)", "Amount (INR)", "Status", "Notes / Purpose"];
  const rows = dues.map((d) => {
    const isTake = d.type === "TO_TAKE";
    const toTake = isTake ? d.amount : "";
    const toGive = !isTake ? d.amount : "";
    const cleanNotes = (d.notes || "").replace(/"/g, '""');
    return [
      `"${formatDate(d.date)}"`,
      `"${getFriendName(d).replace(/"/g, '""')}"`,
      `"${isTake ? "You Lent / Spent" : "Friend Deposited"}"`,
      `"${formatPaymentMode(d.paymentMode)}"`,
      toTake,
      toGive,
      d.amount,
      `"${d.isSettled ? "Settled" : "Active"}"`,
      `"${cleanNotes}"`,
    ].join(",");
  });

  const csvContent = "\uFEFF" + [headers.join(","), ...rows].join("\r\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename || `RupeePulse_Ledger_${summary.friendName.replace(/\s+/g, "_")}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}


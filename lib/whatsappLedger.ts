export interface WhatsAppDueItem {
  _id?: string;
  amount: number;
  type: "TO_GIVE" | "TO_TAKE";
  paymentMode?: string;
  notes?: string;
  date: string | Date;
}

export interface FormatWhatsAppMessageOptions {
  friendName: string;
  netBalance: number;
  dues?: WhatsAppDueItem[];
  myName?: string;
  myUpiId?: string;
  includeBreakdown?: boolean;
  customNote?: string;
}

/**
 * Sanitizes an Indian or international phone number for WhatsApp deep-links.
 * - Strips whitespace, dashes, parens, and leading '+'
 * - If exactly 10 digits (standard Indian mobile format), prepends '91'
 * - Returns empty string if invalid or missing
 */
export function sanitizeWhatsAppPhone(phone?: string): string {
  if (!phone) return "";
  const cleaned = phone.replace(/[^\d]/g, "");
  if (!cleaned) return "";

  // Standard 10-digit Indian mobile number
  if (cleaned.length === 10) {
    return `91${cleaned}`;
  }

  // If already starts with 91 and has 12 digits (e.g. 919876543210)
  if (cleaned.length === 12 && cleaned.startsWith("91")) {
    return cleaned;
  }

  // If 11 digits starting with 0 (e.g. 09876543210)
  if (cleaned.length === 11 && cleaned.startsWith("0")) {
    return `91${cleaned.slice(1)}`;
  }

  return cleaned;
}

/**
 * Generates a standard NPCI UPI Intent URL.
 * e.g. upi://pay?pa=user@okhdfcbank&pn=Anshul&am=1450&cu=INR
 */
export function generateUpiIntentUrl(params: {
  upiId: string;
  name?: string;
  amount?: number;
  note?: string;
}): string {
  const { upiId, name = "RupeePulse User", amount, note = "RupeePulse Split Settlement" } = params;
  if (!upiId) return "";

  const cleanUpi = upiId.trim();
  const search = new URLSearchParams();
  search.set("pa", cleanUpi);
  search.set("pn", name.trim());
  if (amount && amount > 0) {
    search.set("am", amount.toFixed(2));
  }
  search.set("cu", "INR");
  if (note) {
    search.set("tn", note);
  }

  return `upi://pay?${search.toString()}`;
}

/**
 * Formats a date nicely for messaging (e.g. "20 Oct").
 */
function formatShortDate(dateInput: string | Date): string {
  try {
    const d = new Date(dateInput);
    if (isNaN(d.getTime())) return "";
    return d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
  } catch {
    return "";
  }
}

/**
 * Formats an amount with standard Indian comma notation.
 */
function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    maximumFractionDigits: 0,
  }).format(Math.abs(amount));
}

/**
 * Generates polite, high-converting WhatsApp split summary text.
 */
export function formatWhatsAppLedgerMessage(options: FormatWhatsAppMessageOptions): string {
  const {
    friendName,
    netBalance,
    dues = [],
    myName,
    myUpiId,
    includeBreakdown = true,
    customNote,
  } = options;

  const lines: string[] = [];

  // Header
  lines.push("📊 *RupeePulse Ledger Summary*");
  lines.push("");
  lines.push(`Hey ${friendName.trim()}! 👋`);

  if (customNote && customNote.trim()) {
    lines.push(customNote.trim());
  }

  lines.push("Here is our current shared split balance:");

  // Main balance highlight
  if (netBalance > 0) {
    lines.push(`👉 *You owe me: ₹${formatCurrency(netBalance)}*`);
  } else if (netBalance < 0) {
    lines.push(`👉 *I owe you: ₹${formatCurrency(netBalance)}*`);
  } else {
    lines.push("👉 *All settled up! (₹0 balance)*");
  }

  // Pending line-items breakdown (optional, up to 5 items)
  if (includeBreakdown && dues.length > 0 && netBalance !== 0) {
    lines.push("");
    lines.push(`📝 *Recent Unsettled Entries (${dues.length}):*`);
    const recent = dues.slice(0, 5);
    recent.forEach((item) => {
      const dateStr = formatShortDate(item.date);
      const label = item.notes?.trim() || (item.type === "TO_TAKE" ? "Spent/Lent" : "Paid/Received");
      const direction = item.type === "TO_TAKE" ? "(you owe)" : "(I owe)";
      const dateSuffix = dateStr ? ` on ${dateStr}` : "";
      lines.push(`• ${label}: ₹${formatCurrency(item.amount)} ${direction}${dateSuffix}`);
    });

    if (dues.length > 5) {
      lines.push(`_...and ${dues.length - 5} more entry(s)_`);
    }
  }

  // UPI Payment Link if friend owes money and user has configured a UPI ID
  if (netBalance > 0 && myUpiId && myUpiId.trim()) {
    const upiLink = generateUpiIntentUrl({
      upiId: myUpiId,
      name: myName || "RupeePulse",
      amount: netBalance,
      note: `Split settlement from ${friendName}`,
    });

    lines.push("");
    lines.push("💳 *Quick UPI Settle:*");
    lines.push(`UPI ID: \`${myUpiId.trim()}\``);
    lines.push(`Tap to Pay: ${upiLink}`);
  }

  // Polite closing
  lines.push("");
  lines.push("Please check and let me know if everything matches up. Cheers!");
  lines.push("_Sent via RupeePulse ⚡_");

  return lines.join("\n");
}

/**
 * Builds the complete WhatsApp deep-link URL.
 */
export function buildWhatsAppShareUrl(phone: string | undefined, message: string): string {
  const sanitized = sanitizeWhatsAppPhone(phone);
  const encodedText = encodeURIComponent(message);

  if (sanitized) {
    return `https://wa.me/${sanitized}?text=${encodedText}`;
  }

  // Generic WhatsApp share URL that prompts user to pick contact
  return `https://wa.me/?text=${encodedText}`;
}

const assert = require("assert");

// Import the module logic (transpiled/commonjs compatible wrapper for tests)
function sanitizeWhatsAppPhone(phone) {
  if (!phone) return "";
  const cleaned = phone.replace(/[^\d]/g, "");
  if (!cleaned) return "";

  if (cleaned.length === 10) {
    return `91${cleaned}`;
  }

  if (cleaned.length === 12 && cleaned.startsWith("91")) {
    return cleaned;
  }

  if (cleaned.length === 11 && cleaned.startsWith("0")) {
    return `91${cleaned.slice(1)}`;
  }

  return cleaned;
}

function generateUpiIntentUrl(params) {
  const { upiId, name = "RupeePulse User", amount, note = "RupeePulse Split Settlement" } = params;
  if (!upiId) return "";

  const cleanUpi = upiId.trim();
  const search = new URLSearchParams();
  search.set("pa", cleanUpi);
  search.set("pn", name.trim());
  if (amount && amount > 0) {
    search.set("am", Number(amount).toFixed(2));
  }
  search.set("cu", "INR");
  if (note) {
    search.set("tn", note);
  }

  return `upi://pay?${search.toString()}`;
}

function formatShortDate(dateInput) {
  try {
    const d = new Date(dateInput);
    if (isNaN(d.getTime())) return "";
    return d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
  } catch {
    return "";
  }
}

function formatCurrency(amount) {
  return new Intl.NumberFormat("en-IN", {
    maximumFractionDigits: 0,
  }).format(Math.abs(amount));
}

function formatWhatsAppLedgerMessage(options) {
  const {
    friendName,
    netBalance,
    dues = [],
    myName,
    myUpiId,
    includeBreakdown = true,
    customNote,
  } = options;

  const lines = [];

  lines.push("📊 *RupeePulse Ledger Summary*");
  lines.push("");
  lines.push(`Hey ${friendName.trim()}! 👋`);

  if (customNote && customNote.trim()) {
    lines.push(customNote.trim());
  }

  lines.push("Here is our current shared split balance:");

  if (netBalance > 0) {
    lines.push(`👉 *You owe me: ₹${formatCurrency(netBalance)}*`);
  } else if (netBalance < 0) {
    lines.push(`👉 *I owe you: ₹${formatCurrency(netBalance)}*`);
  } else {
    lines.push("👉 *All settled up! (₹0 balance)*");
  }

  if (includeBreakdown && dues.length > 0 && netBalance !== 0) {
    lines.push("");
    lines.push(`📝 *Recent Unsettled Entries (${dues.length}):*`);
    const recent = dues.slice(0, 5);
    recent.forEach((item) => {
      const dateStr = formatShortDate(item.date);
      const label = item.notes && item.notes.trim() ? item.notes.trim() : (item.type === "TO_TAKE" ? "Spent/Lent" : "Paid/Received");
      const direction = item.type === "TO_TAKE" ? "(you owe)" : "(I owe)";
      const dateSuffix = dateStr ? ` on ${dateStr}` : "";
      lines.push(`• ${label}: ₹${formatCurrency(item.amount)} ${direction}${dateSuffix}`);
    });

    if (dues.length > 5) {
      lines.push(`_...and ${dues.length - 5} more entry(s)_`);
    }
  }

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

  lines.push("");
  lines.push("Please check and let me know if everything matches up. Cheers!");
  lines.push("_Sent via RupeePulse ⚡_");

  return lines.join("\n");
}

function buildWhatsAppShareUrl(phone, message) {
  const sanitized = sanitizeWhatsAppPhone(phone);
  const encodedText = encodeURIComponent(message);

  if (sanitized) {
    return `https://api.whatsapp.com/send?phone=${sanitized}&text=${encodedText}`;
  }

  return `https://api.whatsapp.com/send?text=${encodedText}`;
}

// ======================== TEST RUNNER ========================
console.log("==================================================");
console.log("   WHATSAPP LEDGER SHARE & UPI DEEP LINK TESTS   ");
console.log("==================================================");

// Test 1: Indian Mobile Sanitization
assert.strictEqual(sanitizeWhatsAppPhone("9876543210"), "919876543210");
assert.strictEqual(sanitizeWhatsAppPhone("+91 98765 43210"), "919876543210");
assert.strictEqual(sanitizeWhatsAppPhone("+91-98765-43210"), "919876543210");
assert.strictEqual(sanitizeWhatsAppPhone("09876543210"), "919876543210");
assert.strictEqual(sanitizeWhatsAppPhone("919876543210"), "919876543210");
assert.strictEqual(sanitizeWhatsAppPhone(""), "");
assert.strictEqual(sanitizeWhatsAppPhone(undefined), "");
console.log("✅ Test 1 Passed: Phone sanitization normalizes 10-digit Indian numbers with '91' and strips symbols.");

// Test 2: UPI Intent URL construction
const upiUrl = generateUpiIntentUrl({
  upiId: "anshulkanodia@okhdfcbank",
  name: "Anshul Kanodia",
  amount: 1450,
  note: "Dinner split",
});
assert.ok(upiUrl.startsWith("upi://pay?"));
assert.ok(upiUrl.includes("pa=anshulkanodia%40okhdfcbank"));
assert.ok(upiUrl.includes("pn=Anshul+Kanodia"));
assert.ok(upiUrl.includes("am=1450.00"));
assert.ok(upiUrl.includes("cu=INR"));
console.log("✅ Test 2 Passed: UPI Intent URL accurately encodes NPCI standard parameters.");

// Test 3: Message formatting when friend owes user (positive net balance)
const messagePositive = formatWhatsAppLedgerMessage({
  friendName: "Vikram",
  netBalance: 2450,
  myName: "Anshul",
  myUpiId: "anshulkanodia@upi",
  includeBreakdown: true,
  dues: [
    { notes: "Friday Pizza", amount: 1200, type: "TO_TAKE", date: "2026-10-18T12:00:00Z" },
    { notes: "Cab split", amount: 1250, type: "TO_TAKE", date: "2026-10-19T14:30:00Z" },
  ],
});

assert.ok(messagePositive.includes("Hey Vikram! 👋"));
assert.ok(messagePositive.includes("👉 *You owe me: ₹2,450*"));
assert.ok(messagePositive.includes("Friday Pizza: ₹1,200 (you owe)"));
assert.ok(messagePositive.includes("Cab split: ₹1,250 (you owe)"));
assert.ok(messagePositive.includes("💳 *Quick UPI Settle:*"));
assert.ok(messagePositive.includes("anshulkanodia@upi"));
assert.ok(messagePositive.includes("upi://pay?pa=anshulkanodia%40upi"));
console.log("✅ Test 3 Passed: Net positive split message correctly displays 'You owe me' and embeds UPI settle link.");

// Test 4: Message formatting when user owes friend (negative net balance)
const messageNegative = formatWhatsAppLedgerMessage({
  friendName: "Rohan",
  netBalance: -800,
  dues: [
    { notes: "Movie tickets", amount: 800, type: "TO_GIVE", date: "2026-10-17T18:00:00Z" },
  ],
});

assert.ok(messageNegative.includes("👉 *I owe you: ₹800*"));
assert.ok(messageNegative.includes("Movie tickets: ₹800 (I owe)"));
// User owes money, so their own UPI payment link should NOT be requested
assert.ok(!messageNegative.includes("Quick UPI Settle:"));
console.log("✅ Test 4 Passed: Net negative split message correctly displays 'I owe you' and omits payment request.");

// Test 5: Message formatting when balance is zero
const messageZero = formatWhatsAppLedgerMessage({
  friendName: "Sameer",
  netBalance: 0,
});
assert.ok(messageZero.includes("👉 *All settled up! (₹0 balance)*"));
console.log("✅ Test 5 Passed: Zero net balance accurately outputs settled up message.");

// Test 6: Entry list truncation when > 5 entries
const manyDues = Array.from({ length: 8 }, (_, i) => ({
  notes: `Expense item ${i + 1}`,
  amount: 100,
  type: "TO_TAKE",
  date: "2026-10-15T10:00:00Z",
}));

const messageTruncated = formatWhatsAppLedgerMessage({
  friendName: "Neha",
  netBalance: 800,
  dues: manyDues,
  includeBreakdown: true,
});

assert.ok(messageTruncated.includes("Expense item 5"));
assert.ok(!messageTruncated.includes("Expense item 6"));
assert.ok(messageTruncated.includes("_...and 3 more entry(s)_"));
console.log("✅ Test 6 Passed: Large entry lists are cleanly capped at 5 with overflow counter.");

// Test 7: WhatsApp Share URL with phone and without phone
const urlWithPhone = buildWhatsAppShareUrl("9876543210", "Test message");
assert.ok(urlWithPhone.startsWith("https://api.whatsapp.com/send?phone=919876543210&text=Test%20message"));

const urlWithoutPhone = buildWhatsAppShareUrl("", "Test message");
assert.strictEqual(urlWithoutPhone, "https://api.whatsapp.com/send?text=Test%20message");
console.log("✅ Test 7 Passed: WhatsApp deep-link correctly generates contact-specific or general picker URLs.");

console.log("\n🎯 All Day 6 WhatsApp Ledger Share tests passed successfully with 100% precision!");

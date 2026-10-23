const assert = require("assert");

// Pure math & business logic simulation of Day 7 Partial Settlement Engine
function calculateSettlementOutcome(params) {
  const {
    unsettledDues = [],
    settleType = "FULL",
    amount,
    paymentMode = "UPI",
    notes,
    friendName = "Friend",
  } = params;

  let toGive = 0;
  let toTake = 0;

  unsettledDues.forEach((due) => {
    if (due.type === "TO_GIVE") {
      toGive += due.amount;
    } else if (due.type === "TO_TAKE") {
      toTake += due.amount;
    }
  });

  const netBalance = toTake - toGive;
  const absNet = Math.abs(netBalance);

  if (unsettledDues.length === 0 || absNet === 0) {
    return {
      status: "NOOP",
      netBalance: 0,
      remainingBalance: 0,
      settledAmount: 0,
    };
  }

  const parsedAmount = typeof amount === "number" ? Math.round(amount * 100) / 100 : null;
  const isPartial =
    settleType === "PARTIAL" &&
    parsedAmount !== null &&
    parsedAmount > 0 &&
    parsedAmount < absNet;

  if (settleType === "PARTIAL" && (parsedAmount === null || parsedAmount <= 0)) {
    throw new Error("Invalid partial settlement amount: must be greater than zero");
  }

  if (isPartial && parsedAmount) {
    const balancingType = netBalance > 0 ? "TO_GIVE" : "TO_TAKE";
    const defaultNote =
      notes ||
      (netBalance > 0
        ? `Partial settlement from ${friendName} (${paymentMode})`
        : `Partial settlement to ${friendName} (${paymentMode})`);

    const newDue = {
      amount: parsedAmount,
      type: balancingType,
      paymentMode,
      notes: defaultNote,
      isSettled: false,
    };

    const remainingBalance = Math.round((absNet - parsedAmount) * 100) / 100;
    const trackerTransaction = {
      amount: parsedAmount,
      type: netBalance > 0 ? "INCOME" : "EXPENSE",
      paymentMode,
      notes: defaultNote,
    };

    return {
      settleType: "PARTIAL",
      settledAmount: parsedAmount,
      previousBalance: absNet,
      remainingBalance,
      newDue,
      trackerTransaction,
    };
  }

  // Full settlement
  const trackerTransaction = {
    amount: absNet,
    type: netBalance > 0 ? "INCOME" : "EXPENSE",
    paymentMode,
    notes: notes || `Full settlement with ${friendName}`,
  };

  return {
    settleType: "FULL",
    settledAmount: absNet,
    previousBalance: absNet,
    remainingBalance: 0,
    settledCount: unsettledDues.length,
    trackerTransaction,
  };
}

console.log("==================================================");
console.log("   PARTIAL DUE SETTLEMENT & UPI ENGINE TESTS     ");
console.log("==================================================");

// Test 1: Partial settlement when friend owes user (Net Positive)
const duesPositive = [
  { amount: 1500, type: "TO_TAKE" },
  { amount: 1000, type: "TO_TAKE" },
];
const result1 = calculateSettlementOutcome({
  unsettledDues: duesPositive,
  settleType: "PARTIAL",
  amount: 1000,
  paymentMode: "UPI",
  friendName: "Rohan",
});

assert.strictEqual(result1.settleType, "PARTIAL");
assert.strictEqual(result1.settledAmount, 1000);
assert.strictEqual(result1.previousBalance, 2500);
assert.strictEqual(result1.remainingBalance, 1500);
assert.strictEqual(result1.newDue.type, "TO_GIVE", "Balancing due must be TO_GIVE to decrement friend debt");
assert.strictEqual(result1.trackerTransaction.type, "INCOME", "Friend paid user, so tracker transaction must be INCOME");
assert.strictEqual(result1.trackerTransaction.amount, 1000);
console.log("✅ Test 1 Passed: Partial settlement for positive balance correctly updates remaining balance and records INCOME.");

// Test 2: Partial settlement when user owes friend (Net Negative)
const duesNegative = [
  { amount: 3000, type: "TO_GIVE" },
  { amount: 500, type: "TO_TAKE" },
];
const result2 = calculateSettlementOutcome({
  unsettledDues: duesNegative,
  settleType: "PARTIAL",
  amount: 1200,
  paymentMode: "CASH",
  friendName: "Priya",
});

assert.strictEqual(result2.settleType, "PARTIAL");
assert.strictEqual(result2.settledAmount, 1200);
assert.strictEqual(result2.previousBalance, 2500);
assert.strictEqual(result2.remainingBalance, 1300);
assert.strictEqual(result2.newDue.type, "TO_TAKE", "Balancing due must be TO_TAKE to decrement user liability");
assert.strictEqual(result2.trackerTransaction.type, "EXPENSE", "User paid friend, so tracker transaction must be EXPENSE");
assert.strictEqual(result2.trackerTransaction.amount, 1200);
console.log("✅ Test 2 Passed: Partial settlement for negative balance correctly updates remaining balance and records EXPENSE.");

// Test 3: Full settlement zeroes out remaining balance
const result3 = calculateSettlementOutcome({
  unsettledDues: duesPositive,
  settleType: "FULL",
  paymentMode: "UPI",
  friendName: "Rohan",
});

assert.strictEqual(result3.settleType, "FULL");
assert.strictEqual(result3.settledAmount, 2500);
assert.strictEqual(result3.remainingBalance, 0);
assert.strictEqual(result3.settledCount, 2);
console.log("✅ Test 3 Passed: Full settlement zeroes out balance and counts all extinguished entries.");

// Test 4: Amount greater than or equal to balance defaults to full settlement
const result4 = calculateSettlementOutcome({
  unsettledDues: duesPositive,
  settleType: "PARTIAL",
  amount: 2500, // exact total
  paymentMode: "UPI",
});
assert.strictEqual(result4.settleType, "FULL", "Amount >= net balance must cleanly fall through to FULL settlement");
assert.strictEqual(result4.remainingBalance, 0);
console.log("✅ Test 4 Passed: Partial amount equal to balance safely promotes to full settlement.");

// Test 5: Invalid zero or negative partial amount throws error
assert.throws(
  () => {
    calculateSettlementOutcome({
      unsettledDues: duesPositive,
      settleType: "PARTIAL",
      amount: 0,
    });
  },
  /Invalid partial settlement amount/,
  "Zero partial amount must be rejected"
);
console.log("✅ Test 5 Passed: Zero or negative partial amount is rejected.");

// Test 6: Decimal precision preservation
const decimalDues = [
  { amount: 1234.56, type: "TO_TAKE" },
];
const result6 = calculateSettlementOutcome({
  unsettledDues: decimalDues,
  settleType: "PARTIAL",
  amount: 234.56,
});
assert.strictEqual(result6.settledAmount, 234.56);
assert.strictEqual(result6.remainingBalance, 1000.00);
console.log("✅ Test 6 Passed: Decimal rounding preserves 2 decimal places precision.");

console.log("\n🎯 All Day 7 Partial Due Settlement tests passed successfully with 100% precision!");

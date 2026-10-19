/**
 * Vault Guard: Transaction Interceptor & Soft Limits Test Suite (Day 4)
 */
const assert = require("assert");

console.log("==================================================");
console.log("   VAULT GUARD: TRANSACTION INTERCEPTOR (DAY 4)   ");
console.log("==================================================\n");

function computeBudgetImpact({
  currentSpent,
  monthlyLimit,
  alertThreshold = 80,
  enteredAmount,
  originalAmount = 0,
  isSameCategory = true,
}) {
  const baseSpent = isSameCategory
    ? Math.max(0, currentSpent - originalAmount)
    : currentSpent;

  const projectedSpent = baseSpent + enteredAmount;
  const remaining = monthlyLimit - projectedSpent;
  const projectedPercent =
    monthlyLimit > 0 ? Math.round((projectedSpent / monthlyLimit) * 100) : 0;
  const overspendAmount = projectedSpent > monthlyLimit ? projectedSpent - monthlyLimit : 0;

  let status = "SAFE";
  if (projectedSpent >= monthlyLimit) {
    status = "OVER_BUDGET";
  } else if (projectedPercent >= alertThreshold) {
    status = "WARNING";
  }

  return {
    baseSpent,
    projectedSpent,
    remaining,
    projectedPercent,
    overspendAmount,
    status,
    barPercent: Math.min(100, Math.max(0, projectedPercent)),
  };
}

// 1. Create Mode: Safe headroom test
const safeTest = computeBudgetImpact({
  currentSpent: 2000,
  monthlyLimit: 5000,
  alertThreshold: 80,
  enteredAmount: 500,
});
assert.strictEqual(safeTest.projectedSpent, 2500);
assert.strictEqual(safeTest.projectedPercent, 50);
assert.strictEqual(safeTest.remaining, 2500);
assert.strictEqual(safeTest.status, "SAFE");
assert.strictEqual(safeTest.barPercent, 50);
console.log("✅ Test 1 Passed: Safe headroom preview correctly computed in Create mode.");

// 2. Create Mode: Warning threshold trigger (82%)
const warningTest = computeBudgetImpact({
  currentSpent: 3800,
  monthlyLimit: 5000,
  alertThreshold: 80,
  enteredAmount: 300,
});
assert.strictEqual(warningTest.projectedSpent, 4100);
assert.strictEqual(warningTest.projectedPercent, 82);
assert.strictEqual(warningTest.remaining, 900);
assert.strictEqual(warningTest.status, "WARNING");
console.log("✅ Test 2 Passed: Warning threshold correctly flags transaction pushing spend to 82%.");

// 3. Create Mode: Overspend soft limit trigger
const overspendTest = computeBudgetImpact({
  currentSpent: 4500,
  monthlyLimit: 5000,
  alertThreshold: 80,
  enteredAmount: 1000,
});
assert.strictEqual(overspendTest.projectedSpent, 5500);
assert.strictEqual(overspendTest.projectedPercent, 110);
assert.strictEqual(overspendTest.overspendAmount, 500);
assert.strictEqual(overspendTest.status, "OVER_BUDGET");
assert.strictEqual(overspendTest.barPercent, 100, "Visual bar must clamp to 100%");
console.log("✅ Test 3 Passed: Overspend condition reports ₹500 excess with clamped 100% progress bar.");

// 4. Edit Mode: Same category delta adjustment
// Current spent was 3,000 which included the original 1,000 transaction.
// User edits transaction from 1,000 down to 400.
const editSameCat = computeBudgetImpact({
  currentSpent: 3000,
  monthlyLimit: 5000,
  alertThreshold: 80,
  enteredAmount: 400,
  originalAmount: 1000,
  isSameCategory: true,
});
assert.strictEqual(editSameCat.baseSpent, 2000, "Base spent should subtract original 1,000");
assert.strictEqual(editSameCat.projectedSpent, 2400, "Projected spent should be 2,000 + 400 = 2,400");
assert.strictEqual(editSameCat.remaining, 2600);
assert.strictEqual(editSameCat.status, "SAFE");
console.log("✅ Test 4 Passed: Edit mode correctly deducts original transaction amount before applying new value.");

// 5. Edit Mode: Switched to different category
// Category switched to one that already had 1,500 spent. Original transaction was 600 in the old category.
const editDiffCat = computeBudgetImpact({
  currentSpent: 1500,
  monthlyLimit: 3000,
  alertThreshold: 80,
  enteredAmount: 1000,
  originalAmount: 600,
  isSameCategory: false,
});
assert.strictEqual(editDiffCat.baseSpent, 1500, "Base spent should remain 1,500 without deducting old category amount");
assert.strictEqual(editDiffCat.projectedSpent, 2500);
assert.strictEqual(editDiffCat.projectedPercent, 83);
assert.strictEqual(editDiffCat.status, "WARNING");
console.log("✅ Test 5 Passed: Category switch in edit mode accurately applies full amount to target category.");

console.log("\n🎯 All Day 4 Transaction Interceptor unit tests passed with 100% precision!\n");

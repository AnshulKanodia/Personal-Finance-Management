/**
 * Vault Guard: Budget UI Logic & Status Calculation Suite (Day 2)
 */
const assert = require("assert");

console.log("==================================================");
console.log("   VAULT GUARD: UI PROGRESS & METRICS TESTS (DAY 2)");
console.log("==================================================\n");

// Helper: Calculate UI state & progress width
function computeUiProgress(spent, limit, threshold = 80) {
  const percentUsed = limit > 0 ? Math.round((spent / limit) * 100) : 0;
  const barPercent = Math.min(100, Math.max(0, percentUsed));
  let status = "SAFE";
  if (spent >= limit) {
    status = "OVER_BUDGET";
  } else if (percentUsed >= threshold) {
    status = "WARNING";
  }
  const remaining = limit - spent;
  const overspendAmount = spent > limit ? spent - limit : 0;

  return {
    percentUsed,
    barPercent,
    status,
    remaining,
    overspendAmount,
  };
}

// Helper: Summary calculation
function computeBudgetSummary(items) {
  let totalBudget = 0;
  let totalSpent = 0;
  let activeBudgetsCount = 0;
  let overBudgetCount = 0;
  let warningCount = 0;

  items.forEach((item) => {
    if (item.isActive !== false) {
      totalBudget += item.monthlyLimit;
      totalSpent += item.spent;
      activeBudgetsCount++;
      if (item.status === "OVER_BUDGET") overBudgetCount++;
      else if (item.status === "WARNING") warningCount++;
    }
  });

  return {
    totalBudget,
    totalSpent,
    totalRemaining: totalBudget - totalSpent,
    activeBudgetsCount,
    overBudgetCount,
    warningCount,
  };
}

// 1. Safe zone test
const safe = computeUiProgress(3000, 5000, 80);
assert.strictEqual(safe.status, "SAFE");
assert.strictEqual(safe.percentUsed, 60);
assert.strictEqual(safe.barPercent, 60);
assert.strictEqual(safe.remaining, 2000);
console.log("✅ Test 1 Passed: Safe zone calculated accurately (60% used, ₹2,000 remaining headroom).");

// 2. Warning zone test
const warn = computeUiProgress(4250, 5000, 80);
assert.strictEqual(warn.status, "WARNING");
assert.strictEqual(warn.percentUsed, 85);
assert.strictEqual(warn.barPercent, 85);
assert.strictEqual(warn.remaining, 750);
console.log("✅ Test 2 Passed: Warning zone triggered at 85% with amber indicator.");

// 3. Over-budget clamping test (clamped to 100% visual bar width)
const over = computeUiProgress(7500, 5000, 80);
assert.strictEqual(over.status, "OVER_BUDGET");
assert.strictEqual(over.percentUsed, 150);
assert.strictEqual(over.barPercent, 100, "Visual bar width must clamp to 100%");
assert.strictEqual(over.overspendAmount, 2500);
console.log("✅ Test 3 Passed: Over-budget condition clamps visual progress to 100% with ₹2,500 overspend amount.");

// 4. Strict threshold test (50%)
const strict = computeUiProgress(2600, 5000, 50);
assert.strictEqual(strict.status, "WARNING");
assert.strictEqual(strict.percentUsed, 52);
console.log("✅ Test 4 Passed: Strict custom threshold (50%) accurately flags 52% spend.");

// 5. Aggregate summary calculation
const sampleBudgets = [
  { monthlyLimit: 5000, spent: 3000, status: "SAFE", isActive: true },
  { monthlyLimit: 4000, spent: 3400, status: "WARNING", isActive: true },
  { monthlyLimit: 2000, spent: 2500, status: "OVER_BUDGET", isActive: true },
  { monthlyLimit: 10000, spent: 0, status: "SAFE", isActive: false }, // inactive
];
const summary = computeBudgetSummary(sampleBudgets);
assert.strictEqual(summary.totalBudget, 11000);
assert.strictEqual(summary.totalSpent, 8900);
assert.strictEqual(summary.totalRemaining, 2100);
assert.strictEqual(summary.activeBudgetsCount, 3);
assert.strictEqual(summary.overBudgetCount, 1);
assert.strictEqual(summary.warningCount, 1);
console.log("✅ Test 5 Passed: Aggregate budget summary math correctly excludes inactive budgets and tallies health counts.");

console.log("\n🎯 All Day 2 UI & Progress calculation tests passed successfully!\n");

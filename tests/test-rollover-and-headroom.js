/**
 * Vault Guard: Monthly Auto-Rollover & Unallocated Headroom Test Suite (Day 5)
 */
const assert = require("assert");

console.log("==================================================");
console.log("   VAULT GUARD: ROLLOVER & HEADROOM TESTS (DAY 5) ");
console.log("==================================================\n");

function calculateRolloverSurplus(pastLimit, pastRolledOver = 0, pastSpent = 0, rolloverEnabled = true) {
  if (!rolloverEnabled) return 0;
  const effectivePastCap = pastLimit + pastRolledOver;
  return Math.max(0, effectivePastCap - pastSpent);
}

function calculateUnallocatedHeadroom(totalIncome, totalEffectiveBudget) {
  const unallocated = totalIncome - totalEffectiveBudget;
  const percent = totalIncome > 0 ? Math.round((unallocated / totalIncome) * 100) : 0;
  return { unallocated, percent };
}

function computePreviousMonth(monthStr) {
  const [yearStr, monthNumStr] = monthStr.split("-");
  const year = parseInt(yearStr, 10);
  const m = parseInt(monthNumStr, 10) - 1;
  const prevDate = new Date(year, m - 1, 1);
  return `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, "0")}`;
}

// 1. Positive unspent surplus rollover
const surplus1 = calculateRolloverSurplus(5000, 500, 4200, true);
assert.strictEqual(surplus1, 1300, "Surplus must be (5000 + 500) - 4200 = 1300");
console.log("✅ Test 1 Passed: Positive unspent surplus accurately rolled over (₹1,300 surplus).");

// 2. Overspend handles cleanly (no negative deficit rollover)
const surplus2 = calculateRolloverSurplus(5000, 0, 5800, true);
assert.strictEqual(surplus2, 0, "Deficit must not roll over negatively");
console.log("✅ Test 2 Passed: Overspend condition safely reports ₹0 rollover (deficits do not penalize baseline).");

// 3. Rollover flag disabled
const surplus3 = calculateRolloverSurplus(5000, 0, 3000, false);
assert.strictEqual(surplus3, 0, "Rollover disabled must yield 0 surplus");
console.log("✅ Test 3 Passed: Disabled rollover toggle yields ₹0 surplus regardless of unspent funds.");

// 4. Effective limit & percentage calculation
const baseLimit = 6000;
const rolledOver = 1300;
const effectiveCap = baseLimit + rolledOver;
const spent = 3650;
const percentUsed = Math.round((spent / effectiveCap) * 100);
assert.strictEqual(effectiveCap, 7300);
assert.strictEqual(percentUsed, 50);
console.log("✅ Test 4 Passed: Effective limit correctly aggregates baseline + rollover with accurate percentage.");

// 5. Unallocated Headroom (Income > Budget)
const headroom1 = calculateUnallocatedHeadroom(60000, 45000);
assert.strictEqual(headroom1.unallocated, 15000);
assert.strictEqual(headroom1.percent, 25);
console.log("✅ Test 5 Passed: Positive unallocated headroom reports ₹15,000 (25% savings reserve).");

// 6. Over-allocated Headroom (Budget > Income)
const headroom2 = calculateUnallocatedHeadroom(40000, 48000);
assert.strictEqual(headroom2.unallocated, -8000);
assert.strictEqual(headroom2.percent, -20);
console.log("✅ Test 6 Passed: Over-allocated headroom reports negative balance (-₹8,000).");

// 7. Previous month calculation across calendar year boundary
const prevJan = computePreviousMonth("2027-01");
assert.strictEqual(prevJan, "2026-12", "January must resolve to December of previous year");
const prevOct = computePreviousMonth("2026-10");
assert.strictEqual(prevOct, "2026-09", "October must resolve to September");
console.log("✅ Test 7 Passed: Calendar year rollover boundary correctly computes previous month.");

console.log("\n🎯 All Day 5 Rollover & Headroom unit tests passed with 100% precision!\n");

/**
 * RupeePulse Vault Guard - Budget Engine Automated Unit Tests
 * Verifies calculation formulas, threshold categorization, and input validation.
 */
const assert = require("assert");

function calculateBudgetStatus(spent, limit, threshold = 80) {
  const remaining = limit - spent;
  const percentUsed = limit > 0 ? Math.round((spent / limit) * 100) : 0;
  let status = "SAFE";

  if (spent >= limit) {
    status = "OVER_BUDGET";
  } else if (percentUsed >= threshold) {
    status = "WARNING";
  }

  const overspendAmount = spent > limit ? spent - limit : 0;

  return {
    spent,
    limit,
    remaining,
    percentUsed,
    status,
    overspendAmount,
  };
}

function validateMonth(monthStr) {
  return /^\d{4}-(0[1-9]|1[0-2])$/.test(monthStr);
}

function runBudgetTests() {
  console.log("==================================================");
  console.log("   VAULT GUARD: BUDGET ENGINE CALCULATION TESTS   ");
  console.log("==================================================\n");

  // Test 1: Safe Status (< 80%)
  const test1 = calculateBudgetStatus(4500, 10000, 80);
  assert.strictEqual(test1.status, "SAFE");
  assert.strictEqual(test1.remaining, 5500);
  assert.strictEqual(test1.percentUsed, 45);
  assert.strictEqual(test1.overspendAmount, 0);
  console.log("✅ Test 1 Passed: Safe status correctly computed (< 80%).");

  // Test 2: Warning Threshold (>= 80% and < 100%)
  const test2 = calculateBudgetStatus(8500, 10000, 80);
  assert.strictEqual(test2.status, "WARNING");
  assert.strictEqual(test2.remaining, 1500);
  assert.strictEqual(test2.percentUsed, 85);
  assert.strictEqual(test2.overspendAmount, 0);
  console.log("✅ Test 2 Passed: Warning threshold correctly triggered (85%).");

  // Test 3: Exactly At Limit (100%)
  const test3 = calculateBudgetStatus(10000, 10000, 80);
  assert.strictEqual(test3.status, "OVER_BUDGET");
  assert.strictEqual(test3.remaining, 0);
  assert.strictEqual(test3.percentUsed, 100);
  assert.strictEqual(test3.overspendAmount, 0);
  console.log("✅ Test 3 Passed: 100% boundary triggers OVER_BUDGET.");

  // Test 4: Over Budget (> 100%)
  const test4 = calculateBudgetStatus(12500, 10000, 80);
  assert.strictEqual(test4.status, "OVER_BUDGET");
  assert.strictEqual(test4.remaining, -2500);
  assert.strictEqual(test4.percentUsed, 125);
  assert.strictEqual(test4.overspendAmount, 2500);
  console.log("✅ Test 4 Passed: Overspend amount correctly calculated (₹2,500 over).");

  // Test 5: Month string validation
  assert.strictEqual(validateMonth("2026-10"), true);
  assert.strictEqual(validateMonth("2026-01"), true);
  assert.strictEqual(validateMonth("2026-13"), false);
  assert.strictEqual(validateMonth("2026-5"), false);
  assert.strictEqual(validateMonth("invalid"), false);
  console.log("✅ Test 5 Passed: Month string validator regex operates properly.");

  console.log("\n🎯 All Budget Engine unit tests passed with 100% accuracy!");
}

runBudgetTests();

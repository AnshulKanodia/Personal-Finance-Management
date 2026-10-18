/**
 * Vault Guard: Burn Rate Math & Daily Allowance Calculation Test Suite (Day 3)
 */
const assert = require("assert");

console.log("==================================================");
console.log("   VAULT GUARD: BURN RATE & PACING MATH (DAY 3)");
console.log("==================================================\n");

function calculatePacing(spent, limit, totalDays, currentDay, threshold = 80) {
  const daysElapsed = Math.min(totalDays, Math.max(1, currentDay));
  const daysRemaining = Math.max(1, totalDays - currentDay + 1);

  const remaining = limit - spent;
  const percentUsed = limit > 0 ? Math.round((spent / limit) * 100) : 0;
  const dailyRunRate = Math.round(spent / daysElapsed);
  const recommendedDailySpend = remaining > 0 ? Math.round(remaining / daysRemaining) : 0;
  const projectedMonthEndSpend = Math.round((spent / daysElapsed) * totalDays);

  let burnPace = "ON_TRACK";
  if (spent >= limit) {
    burnPace = "BREACHED";
  } else if (projectedMonthEndSpend > limit) {
    burnPace = "OVERSPENDING";
  } else if (percentUsed >= threshold || projectedMonthEndSpend >= limit * (threshold / 100)) {
    burnPace = "WARNING";
  }

  return {
    daysElapsed,
    daysRemaining,
    dailyRunRate,
    recommendedDailySpend,
    projectedMonthEndSpend,
    burnPace,
  };
}

// 1. Mid-month on-track test (Day 15 of 30, Limit 10,000, Spent 3,500)
const onTrack = calculatePacing(3500, 10000, 30, 15);
assert.strictEqual(onTrack.daysElapsed, 15);
assert.strictEqual(onTrack.daysRemaining, 16);
assert.strictEqual(onTrack.dailyRunRate, 233); // 3500 / 15 = 233.33
assert.strictEqual(onTrack.recommendedDailySpend, 406); // 6500 / 16 = 406.25
assert.strictEqual(onTrack.projectedMonthEndSpend, 7000); // 233.33 * 30 = 7000 (70% < 80% threshold)
assert.strictEqual(onTrack.burnPace, "ON_TRACK");
console.log("✅ Test 1 Passed: Disciplined mid-month pacing correctly marked ON_TRACK with safe daily headroom.");

// 2. Mid-month accelerated burn rate test (Day 10 of 31, Limit 5,000, Spent 3,500)
// Run rate: 350/day -> projected 350 * 31 = 10,850 > 5,000
const accelerated = calculatePacing(3500, 5000, 31, 10);
assert.strictEqual(accelerated.dailyRunRate, 350);
assert.strictEqual(accelerated.projectedMonthEndSpend, 10850);
assert.strictEqual(accelerated.burnPace, "OVERSPENDING");
assert.strictEqual(accelerated.recommendedDailySpend, 68); // 1500 / 22 = 68.18
console.log("✅ Test 2 Passed: High burn rate correctly triggers OVERSPENDING pacing alert before cap breach.");

// 3. Breached cap test (Spent 6,000 on Limit 5,000)
const breached = calculatePacing(6000, 5000, 31, 20);
assert.strictEqual(breached.burnPace, "BREACHED");
assert.strictEqual(breached.recommendedDailySpend, 0, "Safe daily spend must be 0 when limit breached");
console.log("✅ Test 3 Passed: Exceeded cap correctly reports BREACHED and clamps recommended daily allowance to ₹0.");

// 4. Month start edge case (Day 1 of 31)
const startMonth = calculatePacing(500, 15500, 31, 1);
assert.strictEqual(startMonth.daysElapsed, 1);
assert.strictEqual(startMonth.daysRemaining, 31);
assert.strictEqual(startMonth.dailyRunRate, 500);
assert.strictEqual(startMonth.recommendedDailySpend, 484); // 15000 / 31 = 483.87
console.log("✅ Test 4 Passed: Month start boundary accurately computes initial 31-day daily runway.");

// 5. Month end edge case (Day 31 of 31, Limit 5,000, Spent 3,500 = 70%)
const endMonth = calculatePacing(3500, 5000, 31, 31);
assert.strictEqual(endMonth.daysElapsed, 31);
assert.strictEqual(endMonth.daysRemaining, 1);
assert.strictEqual(endMonth.recommendedDailySpend, 1500); // 1500 remaining for 1 day
assert.strictEqual(endMonth.burnPace, "ON_TRACK");
console.log("✅ Test 5 Passed: Last day of month boundary accurately allocates final day remaining balance.");

// 6. Warning threshold trigger test (Day 25 of 31, Limit 10,000, Spent 7,500 -> projected 9,300 between 80% and 100%)
const warningPace = calculatePacing(7500, 10000, 31, 25, 80);
assert.strictEqual(warningPace.burnPace, "WARNING");
assert.strictEqual(warningPace.projectedMonthEndSpend, 9300);
console.log("✅ Test 6 Passed: High spend approaching threshold (projected ₹9,300 of ₹10,000) correctly triggers WARNING pacing status.");

console.log("\n🎯 All Day 3 Burn Rate & Pacing calculation tests passed with 100% precision!\n");

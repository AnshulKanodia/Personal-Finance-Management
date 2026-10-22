const assert = require("assert");

function clampDayToMonth(year, monthIndex, day) {
  const lastDayOfMonth = new Date(year, monthIndex + 1, 0).getDate();
  return Math.min(day, lastDayOfMonth);
}

function calculateNextDueDate(dueDay, billingCycle = "MONTHLY", fromDate = new Date()) {
  const ref = new Date(fromDate);
  const currentYear = ref.getFullYear();
  const currentMonth = ref.getMonth();

  const validDayInCurrentMonth = clampDayToMonth(currentYear, currentMonth, dueDay);
  const candidateThisMonth = new Date(currentYear, currentMonth, validDayInCurrentMonth, 23, 59, 59, 999);

  if (candidateThisMonth.getTime() >= ref.getTime()) {
    return candidateThisMonth;
  }

  let monthsToAdd = 1;
  if (billingCycle === "QUARTERLY") monthsToAdd = 3;
  if (billingCycle === "YEARLY") monthsToAdd = 12;

  const targetDate = new Date(currentYear, currentMonth + monthsToAdd, 1);
  const targetYear = targetDate.getFullYear();
  const targetMonth = targetDate.getMonth();
  const validTargetDay = clampDayToMonth(targetYear, targetMonth, dueDay);

  return new Date(targetYear, targetMonth, validTargetDay, 23, 59, 59, 999);
}

function advanceDueDateAfterPayment(currentDueDate, dueDay, billingCycle = "MONTHLY") {
  const base = new Date(currentDueDate);
  let monthsToAdd = 1;
  if (billingCycle === "QUARTERLY") monthsToAdd = 3;
  if (billingCycle === "YEARLY") monthsToAdd = 12;

  const targetDate = new Date(base.getFullYear(), base.getMonth() + monthsToAdd, 1);
  const targetYear = targetDate.getFullYear();
  const targetMonth = targetDate.getMonth();
  const validTargetDay = clampDayToMonth(targetYear, targetMonth, dueDay);

  return new Date(targetYear, targetMonth, validTargetDay, 23, 59, 59, 999);
}

function getSubscriptionStatus(sub, currentDate = new Date()) {
  const today = new Date(currentDate);
  today.setHours(0, 0, 0, 0);

  const due = new Date(sub.nextDueDate);
  const dueMidnight = new Date(due);
  dueMidnight.setHours(0, 0, 0, 0);

  const diffMs = dueMidnight.getTime() - today.getTime();
  const daysRemaining = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  let isPaidThisCycle = false;
  if (sub.lastPaidAt) {
    const lastPaid = new Date(sub.lastPaidAt);
    const cycle = sub.billingCycle || "MONTHLY";
    if (cycle === "MONTHLY") {
      isPaidThisCycle =
        lastPaid.getFullYear() === today.getFullYear() &&
        lastPaid.getMonth() === today.getMonth();
    } else {
      const daysSincePaid = (today.getTime() - lastPaid.getTime()) / (1000 * 60 * 60 * 24);
      isPaidThisCycle = daysSincePaid < 25;
    }
  }

  if (isPaidThisCycle) {
    return { status: "PAID_THIS_CYCLE", daysRemaining, isPaidThisCycle: true };
  }

  if (daysRemaining < 0) {
    return { status: "OVERDUE", daysRemaining, isPaidThisCycle: false };
  }

  const reminderThreshold = sub.reminderDaysBefore ?? 3;
  if (daysRemaining <= reminderThreshold) {
    return { status: "DUE_SOON", daysRemaining, isPaidThisCycle: false };
  }

  return { status: "UPCOMING", daysRemaining, isPaidThisCycle: false };
}

console.log("==================================================");
console.log("       SUBSCRIPTION ENGINE CALCULATION TESTS      ");
console.log("==================================================");

// Test 1: Future due day in current month
const refDate = new Date(2026, 9, 10); // Oct 10, 2026
const nextDue1 = calculateNextDueDate(25, "MONTHLY", refDate);
assert.strictEqual(nextDue1.getFullYear(), 2026);
assert.strictEqual(nextDue1.getMonth(), 9); // Oct
assert.strictEqual(nextDue1.getDate(), 25);
console.log("✅ Test 1 Passed: Future due day in same month correctly scheduled.");

// Test 2: Past due day in current month advances to next month
const nextDue2 = calculateNextDueDate(5, "MONTHLY", refDate);
assert.strictEqual(nextDue2.getFullYear(), 2026);
assert.strictEqual(nextDue2.getMonth(), 10); // Nov
assert.strictEqual(nextDue2.getDate(), 5);
console.log("✅ Test 2 Passed: Past due day rolls over to subsequent month.");

// Test 3: Month boundary clamping (e.g. day 31 in February)
const jan31Ref = new Date(2026, 0, 31, 23, 59, 59); // Jan 31, 2026
const nextFebDue = advanceDueDateAfterPayment(jan31Ref, 31, "MONTHLY");
assert.strictEqual(nextFebDue.getMonth(), 1); // Feb
assert.strictEqual(nextFebDue.getDate(), 28, "Feb 2026 has 28 days, day 31 must clamp to 28");
console.log("✅ Test 3 Passed: Non-standard month days correctly clamp (Feb 31 -> Feb 28).");

// Test 4: Quarterly cycle advance
const nextQuarterly = advanceDueDateAfterPayment(new Date(2026, 0, 15), 15, "QUARTERLY");
assert.strictEqual(nextQuarterly.getMonth(), 3); // April (+3 months)
assert.strictEqual(nextQuarterly.getDate(), 15);
console.log("✅ Test 4 Passed: Quarterly cycle advances 3 months accurately.");

// Test 5: Status computation - OVERDUE
const overdueStatus = getSubscriptionStatus({
  nextDueDate: new Date(2026, 9, 15),
  reminderDaysBefore: 3,
}, new Date(2026, 9, 20)); // Oct 20 vs due Oct 15
assert.strictEqual(overdueStatus.status, "OVERDUE");
assert.ok(overdueStatus.daysRemaining < 0);
console.log("✅ Test 5 Passed: Past due date correctly identified as OVERDUE.");

// Test 6: Status computation - DUE_SOON
const dueSoonStatus = getSubscriptionStatus({
  nextDueDate: new Date(2026, 9, 23),
  reminderDaysBefore: 3,
}, new Date(2026, 9, 21)); // Oct 21 vs due Oct 23 (2 days left)
assert.strictEqual(dueSoonStatus.status, "DUE_SOON");
assert.strictEqual(dueSoonStatus.daysRemaining, 2);
console.log("✅ Test 6 Passed: Imminent bill within reminder window flags DUE_SOON.");

// Test 7: Status computation - PAID_THIS_CYCLE
const paidStatus = getSubscriptionStatus({
  nextDueDate: new Date(2026, 9, 25),
  lastPaidAt: new Date(2026, 9, 18),
  billingCycle: "MONTHLY",
}, new Date(2026, 9, 21));
assert.strictEqual(paidStatus.status, "PAID_THIS_CYCLE");
assert.strictEqual(paidStatus.isPaidThisCycle, true);
console.log("✅ Test 7 Passed: Paid subscription in current cycle flags PAID_THIS_CYCLE.");

console.log("\n🎯 All Subscription Engine tests passed successfully with 100% precision!");

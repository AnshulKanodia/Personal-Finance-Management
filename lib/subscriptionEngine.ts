export type BillingCycle = "MONTHLY" | "QUARTERLY" | "YEARLY";

export type SubscriptionStatus = "OVERDUE" | "DUE_SOON" | "PAID_THIS_CYCLE" | "UPCOMING";

/**
 * Clamps day of month to maximum valid day for a given year and month (0-indexed).
 * e.g. Feb in non-leap year clamps 31 to 28.
 */
export function clampDayToMonth(year: number, monthIndex: number, day: number): number {
  // Day 0 of the next month gives the last day of the target month
  const lastDayOfMonth = new Date(year, monthIndex + 1, 0).getDate();
  return Math.min(day, lastDayOfMonth);
}

/**
 * Calculates the next due date based on dueDay and billingCycle from a reference date.
 */
export function calculateNextDueDate(
  dueDay: number,
  billingCycle: BillingCycle = "MONTHLY",
  fromDate: Date = new Date()
): Date {
  const ref = new Date(fromDate);
  const currentYear = ref.getFullYear();
  const currentMonth = ref.getMonth();
  const currentDay = ref.getDate();

  const validDayInCurrentMonth = clampDayToMonth(currentYear, currentMonth, dueDay);
  const candidateThisMonth = new Date(currentYear, currentMonth, validDayInCurrentMonth, 23, 59, 59, 999);

  // If candidate is still today or in the future
  if (candidateThisMonth.getTime() >= ref.getTime()) {
    return candidateThisMonth;
  }

  // Otherwise, advance by billing cycle
  let monthsToAdd = 1;
  if (billingCycle === "QUARTERLY") monthsToAdd = 3;
  if (billingCycle === "YEARLY") monthsToAdd = 12;

  const targetDate = new Date(currentYear, currentMonth + monthsToAdd, 1);
  const targetYear = targetDate.getFullYear();
  const targetMonth = targetDate.getMonth();
  const validTargetDay = clampDayToMonth(targetYear, targetMonth, dueDay);

  return new Date(targetYear, targetMonth, validTargetDay, 23, 59, 59, 999);
}

/**
 * Advances the due date after a payment is made.
 */
export function advanceDueDateAfterPayment(
  currentDueDate: Date,
  dueDay: number,
  billingCycle: BillingCycle = "MONTHLY"
): Date {
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

/**
 * Determines subscription status and days remaining relative to today.
 */
export function getSubscriptionStatus(
  sub: {
    nextDueDate: Date | string;
    lastPaidAt?: Date | string | null;
    dueDay: number;
    billingCycle?: BillingCycle;
    reminderDaysBefore?: number;
  },
  currentDate: Date = new Date()
): {
  status: SubscriptionStatus;
  daysRemaining: number;
  isPaidThisCycle: boolean;
} {
  const today = new Date(currentDate);
  today.setHours(0, 0, 0, 0);

  const due = new Date(sub.nextDueDate);
  const dueMidnight = new Date(due);
  dueMidnight.setHours(0, 0, 0, 0);

  const diffMs = dueMidnight.getTime() - today.getTime();
  const daysRemaining = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  // Check if paid recently within current billing cycle
  let isPaidThisCycle = false;
  if (sub.lastPaidAt) {
    const lastPaid = new Date(sub.lastPaidAt);
    const cycle = sub.billingCycle || "MONTHLY";
    if (cycle === "MONTHLY") {
      isPaidThisCycle =
        lastPaid.getFullYear() === today.getFullYear() &&
        lastPaid.getMonth() === today.getMonth();
    } else {
      // 30 days window for general
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

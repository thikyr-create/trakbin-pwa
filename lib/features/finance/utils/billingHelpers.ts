// lib/features/finance/utils/billingHelpers.ts

export interface BillingCycle {
  year: number;
  month: number; // 1-12
}

export const STANDARD = {
  ISSUE_DAY: 1, // invoices issue on the 1st
  DUE_DAY: 5, // due on the 5th
  DEFAULT_GRACE_DAYS: 2, // grace through the 7th
  DEFAULT_CUTOFF_DAY: 25, // per-company override via haulers.billing_cutoff_day
};

export function addMonths(cycle: BillingCycle, delta: number): BillingCycle {
  const idx = cycle.year * 12 + (cycle.month - 1) + delta;
  return { year: Math.floor(idx / 12), month: (idx % 12) + 1 };
}

export function compareCycles(a: BillingCycle, b: BillingCycle): number {
  return a.year * 12 + a.month - (b.year * 12 + b.month);
}

export function cycleOfDate(date: Date): BillingCycle {
  return { year: date.getFullYear(), month: date.getMonth() + 1 };
}

export function periodLabel(cycle: BillingCycle): string {
  const d = new Date(cycle.year, cycle.month - 1, 1);
  return d.toLocaleDateString("en-NG", { month: "long", year: "numeric" });
}

/** Due date for a cycle: the 5th (or plan's due_day) of the billing month. */
export function invoiceDueDate(cycle: BillingCycle, dueDay: number = STANDARD.DUE_DAY): string {
  const day = Math.min(dueDay, 28); // safe for all months
  return `${cycle.year}-${String(cycle.month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

/** Grace window ends due_day + grace_days. */
export function graceEndDate(dueDateIso: string, graceDays: number = STANDARD.DEFAULT_GRACE_DAYS): Date {
  const due = new Date(dueDateIso);
  due.setDate(due.getDate() + graceDays);
  due.setHours(23, 59, 59, 999);
  return due;
}

/** Overdue = now past due date + grace window. */
export function isInvoiceOverdue(
  dueDateIso: string,
  graceDays: number = STANDARD.DEFAULT_GRACE_DAYS,
  now: Date = new Date()
): boolean {
  return now.getTime() > graceEndDate(dueDateIso, graceDays).getTime();
}

/**
 * CUTOFF RULE (confirmed):
 * A building activated on/after the cutoff day of month M is excluded from
 * month M+1's run; its first invoice issues for cycle M+2.
 * Activated before the cutoff of month M → first invoice for cycle M+1.
 */
export function firstBillableCycle(
  activatedAt: string | Date,
  cutoffDay: number = STANDARD.DEFAULT_CUTOFF_DAY
): BillingCycle {
  const a = activatedAt instanceof Date ? activatedAt : new Date(activatedAt);
  const activationMonth = cycleOfDate(a);
  const afterCutoff = a.getDate() >= cutoffDay;
  return addMonths(activationMonth, afterCutoff ? 2 : 1);
}

export function isBillableForCycle(input: {
  activatedAt: string | Date;
  cycle: BillingCycle;
  cutoffDay?: number;
}): boolean {
  const first = firstBillableCycle(
    input.activatedAt,
    input.cutoffDay ?? STANDARD.DEFAULT_CUTOFF_DAY
  );
  return compareCycles(input.cycle, first) >= 0;
}

/** Derived invoice number — never stored, always consistent with the row. */
export function deriveInvoiceNumber(id: number | string, dueDateIso: string): string {
  const d = new Date(dueDateIso);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  return `INV-${y}${m}-${id}`;
}

/** Extract the billing cycle from an invoice's due_date (period anchor). */
export function cycleOfDueDate(dueDateIso: string): BillingCycle {
  return cycleOfDate(new Date(dueDateIso));
}

/** Next scheduled billing run: the 1st of the next month from now. */
export function nextBillingRun(now: Date = new Date()): Date {
  return new Date(now.getFullYear(), now.getMonth() + 1, STANDARD.ISSUE_DAY);
}
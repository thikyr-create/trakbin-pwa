// lib/features/finance/utils/billingHelpers.ts

export interface BillingCycle {
  year: number;
  month: number; // 1-12
}

export interface BillingSettings {
  cutoff_day: number;
  invoice_day: number;
  due_day: number;
  grace_period_days: number;
  auto_invoice_generation: boolean;
}

export const DEFAULTS: BillingSettings = {
  cutoff_day: 25,
  invoice_day: 1,
  due_day: 5,
  grace_period_days: 2,
  auto_invoice_generation: true,
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

/**
 * Issue date for a cycle: the invoice_day from company_settings.
 * Defaults to the 1st if settings missing.
 */
export function invoiceIssueDate(
  cycle: BillingCycle,
  invoiceDay: number = DEFAULTS.invoice_day
): string {
  const day = Math.min(invoiceDay, 28); // safe for all months
  return `${cycle.year}-${String(cycle.month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

/**
 * Due date for a cycle: the due_day from company_settings.
 * Defaults to the 5th if settings missing.
 */
export function invoiceDueDate(
  cycle: BillingCycle,
  dueDay: number = DEFAULTS.due_day
): string {
  const day = Math.min(dueDay, 28); // safe for all months
  return `${cycle.year}-${String(cycle.month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

/** Grace window ends due_day + grace_days. */
export function graceEndDate(
  dueDateIso: string,
  graceDays: number = DEFAULTS.grace_period_days
): Date {
  const due = new Date(dueDateIso);
  due.setDate(due.getDate() + graceDays);
  due.setHours(23, 59, 59, 999);
  return due;
}

/** Overdue = now past due date + grace window. */
export function isInvoiceOverdue(
  dueDateIso: string,
  graceDays: number = DEFAULTS.grace_period_days,
  now: Date = new Date()
): boolean {
  return now.getTime() > graceEndDate(dueDateIso, graceDays).getTime();
}

/**
 * CUTOFF RULE (confirmed):
 * A building activated on/after the cutoff day of month M is excluded from
 * month M+1's run; its first invoice issues for cycle M+2.
 * Activated before the cutoff of month M → first invoice for cycle M+1.
 *
 * Now reads cutoff_day from company_settings instead of haulers.billing_cutoff_day.
 */
export function firstBillableCycle(
  activatedAt: string | Date,
  cutoffDay: number = DEFAULTS.cutoff_day
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
    input.cutoffDay ?? DEFAULTS.cutoff_day
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

/** Next scheduled billing run: the invoice_day of the next month from now. */
export function nextBillingRun(
  now: Date = new Date(),
  invoiceDay: number = DEFAULTS.invoice_day
): Date {
  const day = Math.min(invoiceDay, 28);
  return new Date(now.getFullYear(), now.getMonth() + 1, day);
}
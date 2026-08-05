// lib/core/finance/BillingStatus.ts

export interface BillingStatusMeta {
  label: string;
  classes: string;
  dot: string;
  pulse?: boolean;
}

const NEUTRAL: BillingStatusMeta = {
  label: "Unknown",
  classes: "bg-gray-100 text-gray-600 ring-gray-200",
  dot: "bg-gray-400",
};

export const INVOICE_STATUS_MAP: Record<string, BillingStatusMeta> = {
  draft: {
    label: "Draft",
    classes: "bg-gray-100 text-gray-600 ring-gray-200",
    dot: "bg-gray-400",
  },
  issued: {
    label: "Issued",
    classes: "bg-sky-50 text-sky-700 ring-sky-200",
    dot: "bg-sky-500",
  },
  viewed: {
    label: "Viewed",
    classes: "bg-violet-50 text-violet-700 ring-violet-200",
    dot: "bg-violet-500",
  },
  paid: {
    label: "Paid",
    classes: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    dot: "bg-emerald-500",
  },
  partially_paid: {
    label: "Partially paid",
    classes: "bg-amber-50 text-amber-700 ring-amber-200",
    dot: "bg-amber-500",
  },
  overdue: {
    label: "Overdue",
    classes: "bg-red-50 text-red-700 ring-red-200",
    dot: "bg-red-500",
    pulse: true,
  },
  cancelled: {
    label: "Cancelled",
    classes: "bg-gray-100 text-gray-500 ring-gray-200",
    dot: "bg-gray-300",
  },
};

export const PLAN_STATUS_MAP: Record<string, BillingStatusMeta> = {
  active: {
    label: "Plan active",
    classes: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    dot: "bg-emerald-500",
  },
  paused: {
    label: "Plan paused",
    classes: "bg-amber-50 text-amber-700 ring-amber-200",
    dot: "bg-amber-500",
  },
  cancelled: {
    label: "Plan cancelled",
    classes: "bg-red-50 text-red-700 ring-red-200",
    dot: "bg-red-500",
  },
};

export function invoiceStatusMeta(status?: string | null): BillingStatusMeta {
  return INVOICE_STATUS_MAP[status || ""] ?? { ...NEUTRAL, label: status || "Unknown" };
}

export function planStatusMeta(status?: string | null): BillingStatusMeta {
  return PLAN_STATUS_MAP[status || ""] ?? { ...NEUTRAL, label: status || "Unknown" };
}
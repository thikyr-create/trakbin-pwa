// lib/core/finance/FinanceStatus.ts

export interface FinanceStatusMeta {
  label: string;
  classes: string;
  dot: string;
  pulse?: boolean;
}

const NEUTRAL: FinanceStatusMeta = {
  label: "Unknown",
  classes: "bg-gray-100 text-gray-600 ring-gray-200",
  dot: "bg-gray-400",
};

export const PAYMENT_STATUS_MAP: Record<string, FinanceStatusMeta> = {
  pending: {
    label: "Pending",
    classes: "bg-amber-50 text-amber-700 ring-amber-200",
    dot: "bg-amber-500",
  },
  successful: {
    label: "Successful",
    classes: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    dot: "bg-emerald-500",
  },
  failed: {
    label: "Failed",
    classes: "bg-red-50 text-red-700 ring-red-200",
    dot: "bg-red-500",
  },
  refunded: {
    label: "Refunded",
    classes: "bg-gray-100 text-gray-600 ring-gray-200",
    dot: "bg-gray-400",
  },
};

export const PAYOUT_STATUS_MAP: Record<string, FinanceStatusMeta> = {
  requested: {
    label: "Requested",
    classes: "bg-amber-50 text-amber-700 ring-amber-200",
    dot: "bg-amber-500",
  },
  processing: {
    label: "Processing",
    classes: "bg-sky-50 text-sky-700 ring-sky-200",
    dot: "bg-sky-500",
    pulse: true,
  },
  paid: {
    label: "Paid",
    classes: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    dot: "bg-emerald-500",
  },
  failed: {
    label: "Failed",
    classes: "bg-red-50 text-red-700 ring-red-200",
    dot: "bg-red-500",
  },
  reversed: {
    label: "Reversed",
    classes: "bg-red-50 text-red-700 ring-red-200",
    dot: "bg-red-500",
  },
};

export const LEDGER_STATUS_MAP: Record<string, FinanceStatusMeta> = {
  settled: {
    label: "Settled",
    classes: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    dot: "bg-emerald-500",
  },
  pending: {
    label: "Pending settlement",
    classes: "bg-amber-50 text-amber-700 ring-amber-200",
    dot: "bg-amber-500",
  },
};

export function paymentStatusMeta(status?: string | null): FinanceStatusMeta {
  return PAYMENT_STATUS_MAP[status || ""] ?? { ...NEUTRAL, label: status || "Unknown" };
}

export function payoutStatusMeta(status?: string | null): FinanceStatusMeta {
  return PAYOUT_STATUS_MAP[status || ""] ?? { ...NEUTRAL, label: status || "Unknown" };
}

export function ledgerStatusMeta(status?: string | null): FinanceStatusMeta {
  return LEDGER_STATUS_MAP[status || ""] ?? { ...NEUTRAL, label: status || "Unknown" };
}
// lib/core/building/BuildingStatus.ts

export interface StatusMeta {
  label: string;
  classes: string;
  dot: string;
  pulse?: boolean;
}

const NEUTRAL: StatusMeta = {
  label: "Unknown",
  classes: "bg-gray-100 text-gray-600 ring-gray-200",
  dot: "bg-gray-400",
};

export const BUILDING_STATUS_MAP: Record<string, StatusMeta> = {
  active: {
    label: "Active",
    classes: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    dot: "bg-emerald-500",
  },
  pending: {
    label: "Pending",
    classes: "bg-amber-50 text-amber-700 ring-amber-200",
    dot: "bg-amber-500",
  },
  picked_up: {
    label: "Picked up",
    classes: "bg-sky-50 text-sky-700 ring-sky-200",
    dot: "bg-sky-500",
  },
  inactive: {
    label: "Inactive",
    classes: "bg-gray-100 text-gray-500 ring-gray-200",
    dot: "bg-gray-300",
  },
  suspended: {
    label: "Suspended",
    classes: "bg-red-50 text-red-700 ring-red-200",
    dot: "bg-red-500",
  },
  unassigned: {
    label: "Unassigned",
    classes: "bg-gray-100 text-gray-600 ring-gray-200",
    dot: "bg-gray-400",
  },
};

export const PAYMENT_STATUS_MAP: Record<string, StatusMeta> = {
  paid: {
    label: "Paid",
    classes: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    dot: "bg-emerald-500",
  },
  unpaid: {
    label: "Unpaid",
    classes: "bg-red-50 text-red-700 ring-red-200",
    dot: "bg-red-500",
  },
  pending: {
    label: "Payment pending",
    classes: "bg-amber-50 text-amber-700 ring-amber-200",
    dot: "bg-amber-500",
  },
  overdue: {
    label: "Overdue",
    classes: "bg-red-50 text-red-700 ring-red-200",
    dot: "bg-red-500",
  },
  failed: {
    label: "Payment failed",
    classes: "bg-red-50 text-red-700 ring-red-200",
    dot: "bg-red-500",
  },
};

export const SERVICE_STATUS_MAP: Record<string, StatusMeta> = {
  active: {
    label: "Service active",
    classes: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    dot: "bg-emerald-500",
  },
  pending: {
    label: "Service pending",
    classes: "bg-amber-50 text-amber-700 ring-amber-200",
    dot: "bg-amber-500",
  },
  paused: {
    label: "Paused",
    classes: "bg-gray-100 text-gray-600 ring-gray-200",
    dot: "bg-gray-400",
  },
  expired: {
    label: "Expired",
    classes: "bg-red-50 text-red-700 ring-red-200",
    dot: "bg-red-500",
  },
  cancelled: {
    label: "Cancelled",
    classes: "bg-red-50 text-red-700 ring-red-200",
    dot: "bg-red-500",
  },
};

export const COLLECTION_STATUS_MAP: Record<string, StatusMeta> = {
  completed: {
    label: "Completed",
    classes: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    dot: "bg-emerald-500",
  },
  scheduled: {
    label: "Scheduled",
    classes: "bg-sky-50 text-sky-700 ring-sky-200",
    dot: "bg-sky-500",
  },
  in_progress: {
    label: "In progress",
    classes: "bg-sky-50 text-sky-700 ring-sky-200",
    dot: "bg-sky-500",
    pulse: true,
  },
  missed: {
    label: "Missed",
    classes: "bg-red-50 text-red-700 ring-red-200",
    dot: "bg-red-500",
  },
  cancelled: {
    label: "Cancelled",
    classes: "bg-gray-100 text-gray-600 ring-gray-200",
    dot: "bg-gray-400",
  },
};

export const PAYMENT_TXN_STATUS_MAP: Record<string, StatusMeta> = {
  successful: {
    label: "Successful",
    classes: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    dot: "bg-emerald-500",
  },
  pending: {
    label: "Pending",
    classes: "bg-amber-50 text-amber-700 ring-amber-200",
    dot: "bg-amber-500",
  },
  failed: {
    label: "Failed",
    classes: "bg-red-50 text-red-700 ring-red-200",
    dot: "bg-red-500",
  },
};

export function buildingStatusMeta(status?: string | null): StatusMeta {
  return BUILDING_STATUS_MAP[status || ""] ?? { ...NEUTRAL, label: status || "Unknown" };
}

export function paymentStatusMeta(status?: string | null): StatusMeta {
  return PAYMENT_STATUS_MAP[status || ""] ?? { ...NEUTRAL, label: status || "Unknown" };
}

export function serviceStatusMeta(status?: string | null): StatusMeta {
  return SERVICE_STATUS_MAP[status || ""] ?? { ...NEUTRAL, label: status || "Unknown" };
}

export function collectionStatusMeta(status?: string | null): StatusMeta {
  return COLLECTION_STATUS_MAP[status || ""] ?? { ...NEUTRAL, label: status || "Unknown" };
}

export function paymentTxnStatusMeta(status?: string | null): StatusMeta {
  return PAYMENT_TXN_STATUS_MAP[status || ""] ?? { ...NEUTRAL, label: status || "Unknown" };
}
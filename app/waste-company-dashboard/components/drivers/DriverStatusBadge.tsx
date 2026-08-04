"use client";

import { JetBrains_Mono } from "next/font/google";

const mono = JetBrains_Mono({ subsets: ["latin"], display: "swap", variable: "--font-mono" });

export interface DriverStatusMeta {
  label: string;
  classes: string;
  dot: string;
  pulse?: boolean;
}

export const DRIVER_STATUS_MAP: Record<string, DriverStatusMeta> = {
  active: {
    label: "Active",
    classes: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    dot: "bg-emerald-500",
  },
  on_route: {
    label: "On route",
    classes: "bg-sky-50 text-sky-700 ring-sky-200",
    dot: "bg-sky-500",
    pulse: true,
  },
  off_duty: {
    label: "Off duty",
    classes: "bg-gray-100 text-gray-600 ring-gray-200",
    dot: "bg-gray-400",
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
};

export const DRIVER_STATUS_OPTIONS = Object.entries(DRIVER_STATUS_MAP).map(
  ([value, meta]) => ({ value, label: meta.label })
);

interface DriverStatusBadgeProps {
  status: string;
  size?: "sm" | "md";
}

export default function DriverStatusBadge({ status, size = "md" }: DriverStatusBadgeProps) {
  const meta =
    DRIVER_STATUS_MAP[status] ??
    ({
      label: status || "Unknown",
      classes: "bg-gray-100 text-gray-600 ring-gray-200",
      dot: "bg-gray-400",
    } as DriverStatusMeta);

  const sizeClasses =
    size === "sm" ? "px-2 py-0.5 text-[9px]" : "px-2.5 py-1 text-[10px]";

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-bold uppercase tracking-wider ring-1 ${meta.classes} ${sizeClasses} ${mono.className}`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${meta.dot} ${meta.pulse ? "animate-pulse" : ""}`}
      />
      {meta.label}
    </span>
  );
}
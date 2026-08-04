"use client";

import { JetBrains_Mono } from "next/font/google";

const mono = JetBrains_Mono({ subsets: ["latin"], display: "swap", variable: "--font-mono" });

export interface TruckStatusMeta {
  label: string;
  classes: string;
  dot: string;
  pulse?: boolean;
}

export const TRUCK_STATUS_MAP: Record<string, TruckStatusMeta> = {
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
  idle: {
    label: "Idle",
    classes: "bg-gray-100 text-gray-600 ring-gray-200",
    dot: "bg-gray-400",
  },
  maintenance: {
    label: "Maintenance",
    classes: "bg-amber-50 text-amber-700 ring-amber-200",
    dot: "bg-amber-500",
  },
};

interface TruckStatusBadgeProps {
  status: string;
  size?: "sm" | "md";
}

export default function TruckStatusBadge({ status, size = "md" }: TruckStatusBadgeProps) {
  const meta =
    TRUCK_STATUS_MAP[status] ??
    ({
      label: status || "Unknown",
      classes: "bg-gray-100 text-gray-600 ring-gray-200",
      dot: "bg-gray-400",
    } as TruckStatusMeta);

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
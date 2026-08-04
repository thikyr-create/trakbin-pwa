"use client";

import { JetBrains_Mono } from "next/font/google";
import {
  buildingStatusMeta,
  paymentStatusMeta,
  serviceStatusMeta,
  collectionStatusMeta,
  type StatusMeta,
} from "@/lib/core/building/BuildingStatus";

const mono = JetBrains_Mono({ subsets: ["latin"], display: "swap", variable: "--font-mono" });

export type BuildingBadgeKind = "status" | "payment" | "service" | "collection";

const META_RESOLVERS: Record<BuildingBadgeKind, (v?: string | null) => StatusMeta> = {
  status: buildingStatusMeta,
  payment: paymentStatusMeta,
  service: serviceStatusMeta,
  collection: collectionStatusMeta,
};

interface BuildingStatusBadgeProps {
  kind: BuildingBadgeKind;
  value?: string | null;
  size?: "sm" | "md";
}

export default function BuildingStatusBadge({
  kind,
  value,
  size = "md",
}: BuildingStatusBadgeProps) {
  const meta = META_RESOLVERS[kind](value);

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
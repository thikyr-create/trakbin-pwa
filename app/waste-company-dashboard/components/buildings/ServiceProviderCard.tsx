"use client";

import { Handshake } from "lucide-react";
import { JetBrains_Mono } from "next/font/google";
import BuildingStatusBadge from "./BuildingStatusBadge";

const mono = JetBrains_Mono({ subsets: ["latin"], display: "swap", variable: "--font-mono" });

interface ServiceProviderCardProps {
  serviceAssignment: any | null;
  zoneName: string | null;
}

function formatDate(value?: string | null): string {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" });
}

export default function ServiceProviderCard({
  serviceAssignment,
  zoneName,
}: ServiceProviderCardProps) {
  if (!serviceAssignment) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-gray-50/50 p-6 text-center">
        <Handshake className="mb-2 h-7 w-7 text-gray-300" />
        <p className="text-sm font-bold text-gray-500">Service not activated</p>
        <p className="mt-1 text-[11px] font-medium text-gray-400">
          This building is awaiting zone approval. No service agreement exists yet.
        </p>
      </div>
    );
  }

  const pickupDays: string[] = serviceAssignment.pickup_days || [];

  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-5">
      <div className="mb-4 flex items-center justify-between">
        <p className={`${mono.className} text-[10px] font-bold uppercase tracking-[0.18em] text-gray-500`}>
          Service agreement
        </p>
        <BuildingStatusBadge kind="service" value={serviceAssignment.service_status} size="sm" />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl bg-gray-50 p-3">
          <p className={`${mono.className} text-[9px] font-bold uppercase tracking-wider text-gray-400`}>
            Zone
          </p>
          <p className="mt-0.5 text-sm font-bold text-gray-900">{zoneName || "—"}</p>
        </div>
        <div className="rounded-xl bg-gray-50 p-3">
          <p className={`${mono.className} text-[9px] font-bold uppercase tracking-wider text-gray-400`}>
            Activated
          </p>
          <p className="mt-0.5 text-sm font-bold text-gray-900">
            {formatDate(serviceAssignment.activated_at)}
          </p>
        </div>
        <div className="rounded-xl bg-gray-50 p-3">
          <p className={`${mono.className} text-[9px] font-bold uppercase tracking-wider text-gray-400`}>
            Pickup days
          </p>
          <p className="mt-0.5 text-sm font-bold text-gray-900">
            {pickupDays.map((d) => d.slice(0, 3)).join(" · ") || "—"}
          </p>
        </div>
        <div className="rounded-xl bg-gray-50 p-3">
          <p className={`${mono.className} text-[9px] font-bold uppercase tracking-wider text-gray-400`}>
            Time window
          </p>
          <p className="mt-0.5 text-sm font-bold text-gray-900">
            {serviceAssignment.time_window || "—"}
          </p>
        </div>
      </div>
    </div>
  );
}
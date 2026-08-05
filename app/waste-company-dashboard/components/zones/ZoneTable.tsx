"use client";

import { motion } from "framer-motion";
import { MapPin, Eye, Trash2, Power, Radius } from "lucide-react";
import { Sora, JetBrains_Mono } from "next/font/google";
import type { ZoneRecord } from "@/lib/features/zones/services/zoneService";

const display = Sora({ subsets: ["latin"], display: "swap", variable: "--font-display" });
const mono = JetBrains_Mono({ subsets: ["latin"], display: "swap", variable: "--font-mono" });
const EASE = [0.22, 1, 0.36, 1] as [number, number, number, number];

interface ZoneTableProps {
  zones: ZoneRecord[];
  onView: (zone: ZoneRecord) => void;
  onToggle: (zone: ZoneRecord) => void;
  onDelete: (zone: ZoneRecord) => void;
  busyId?: string | null;
}

function formatDate(value?: string | null): string {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" });
}

export default function ZoneTable({
  zones,
  onView,
  onToggle,
  onDelete,
  busyId,
}: ZoneTableProps) {
  if (zones.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-[24px] border border-gray-200/80 bg-white p-14 text-center shadow-sm">
        <MapPin className="mb-3 h-9 w-9 text-gray-300" />
        <p className="text-base font-bold text-gray-600">No zones defined yet</p>
        <p className="mt-1 max-w-sm text-xs text-gray-400">
          Create your first service zone — buildings assigned to it will appear automatically
          via their service assignment.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-[24px] border border-gray-200/80 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-gray-100 px-6 py-5">
        <h2 className={`${display.className} flex items-center gap-2.5 text-lg font-extrabold tracking-tight text-gray-900`}>
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100">
            <MapPin className="h-4 w-4" />
          </span>
          Service zones
        </h2>
        <span className={`${mono.className} text-[11px] font-bold uppercase tracking-wider text-gray-400`}>
          {zones.length} zone{zones.length === 1 ? "" : "s"}
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[680px] text-left">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50/60">
              {["Zone", "Buildings", "Active service", "Coverage", "Status", "Actions"].map((h) => (
                <th
                  key={h}
                  className={`px-5 py-3 ${mono.className} text-[10px] font-bold uppercase tracking-[0.18em] text-gray-500`}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {zones.map((z, i) => {
              const isActive = z.is_active !== false;
              const busy = busyId === z.id;

              return (
                <motion.tr
                  key={z.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: Math.min(i, 10) * 0.04, ease: EASE }}
                  className="border-b border-gray-50 last:border-0"
                >
                  <td className="px-5 py-4">
                    <p className="text-sm font-bold text-gray-900">{z.zone_name || "Unnamed zone"}</p>
                    <p className={`${mono.className} text-[10px] font-semibold uppercase tracking-wider text-gray-400`}>
                      created {formatDate(z.created_at)}
                    </p>
                  </td>

                  <td className="px-5 py-4">
                    <p className={`${display.className} text-base font-extrabold tabular-nums text-gray-900`}>
                      {z.building_count}
                    </p>
                  </td>

                  <td className="px-5 py-4">
                    <p className={`${display.className} text-base font-extrabold tabular-nums ${
                      z.active_service_count > 0 ? "text-emerald-700" : "text-gray-400"
                    }`}>
                      {z.active_service_count}
                    </p>
                  </td>

                  <td className="px-5 py-4">
                    {z.radius_km != null ? (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-50 px-2.5 py-1 text-[10px] font-bold text-gray-600 ring-1 ring-gray-200">
                        <Radius size={11} />
                        {Number(z.radius_km).toFixed(1)} km radius
                      </span>
                    ) : (
                      <span className="text-xs font-semibold text-gray-300">not set</span>
                    )}
                  </td>

                  <td className="px-5 py-4">
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wider ring-1 ${mono.className} ${
                        isActive
                          ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
                          : "bg-gray-100 text-gray-500 ring-gray-200"
                      }`}
                    >
                      <span className={`h-1.5 w-1.5 rounded-full ${isActive ? "bg-emerald-500" : "bg-gray-400"}`} />
                      {isActive ? "Active" : "Inactive"}
                    </span>
                  </td>

                  <td className="px-5 py-4">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => onView(z)}
                        title="View zone"
                        className="rounded-lg p-2 text-gray-400 transition hover:bg-emerald-50 hover:text-emerald-600"
                      >
                        <Eye size={15} />
                      </button>
                      <button
                        onClick={() => onToggle(z)}
                        disabled={busy}
                        title={isActive ? "Deactivate zone" : "Activate zone"}
                        className="rounded-lg p-2 text-gray-400 transition hover:bg-sky-50 hover:text-sky-600 disabled:opacity-40"
                      >
                        <Power size={15} />
                      </button>
                      <button
                        onClick={() => onDelete(z)}
                        disabled={busy}
                        title="Delete zone"
                        className="rounded-lg p-2 text-gray-400 transition hover:bg-red-50 hover:text-red-600 disabled:opacity-40"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </motion.tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
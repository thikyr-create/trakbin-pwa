"use client";

import { motion } from "framer-motion";
import { ChevronRight, UserRound } from "lucide-react";
import { Sora, JetBrains_Mono } from "next/font/google";
import BuildingStatusBadge from "./BuildingStatusBadge";
import type { BuildingRecord } from "@/lib/features/buildings/services/buildingService";

const display = Sora({ subsets: ["latin"], display: "swap", variable: "--font-display" });
const mono = JetBrains_Mono({ subsets: ["latin"], display: "swap", variable: "--font-mono" });
const EASE = [0.22, 1, 0.36, 1] as [number, number, number, number];

interface BuildingTableProps {
  buildings: BuildingRecord[];
  onSelect: (building: BuildingRecord) => void;
}

function formatDate(value?: string | null): string {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-NG", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

export default function BuildingTable({ buildings, onSelect }: BuildingTableProps) {
  return (
    <div className="overflow-hidden rounded-[20px] border border-gray-200/80 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[900px] text-left">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50/60">
              {["Building", "Address", "Zone", "Driver", "Schedule", "Next", "Status", "Payment", ""].map(
                (header, i) => (
                  <th
                    key={i}
                    className={`px-4 py-3 ${mono.className} text-[10px] font-bold uppercase tracking-[0.18em] text-gray-500`}
                  >
                    {header}
                  </th>
                )
              )}
            </tr>
          </thead>
          <tbody>
            {buildings.map((b, i) => (
              <motion.tr
                key={b.custom_id || b.building_id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: Math.min(i, 15) * 0.03, ease: EASE }}
                onClick={() => onSelect(b)}
                className="group cursor-pointer border-b border-gray-50 transition-colors last:border-0 hover:bg-emerald-50/40"
              >
                <td className="px-4 py-4">
                  <p className={`${mono.className} text-xs font-bold uppercase tracking-wider text-gray-900`}>
                    {b.custom_id || "N/A"}
                  </p>
                  <p className="text-[11px] font-medium text-gray-400">
                    {b.building_type || "N/A"}
                  </p>
                </td>

                <td className="max-w-[220px] px-4 py-4">
                  <p className="truncate text-xs font-semibold text-gray-700">
                    {b.address || "No address"}
                  </p>
                  <p className="truncate text-[11px] font-medium text-gray-400">
                    {b.estate || "—"}
                  </p>
                </td>

                <td className="px-4 py-4">
                  <span className="text-xs font-semibold text-gray-700">
                    {b.zone_name || "—"}
                  </span>
                </td>

                <td className="px-4 py-4">
                  {b.assigned_driver_name ? (
                    <span className="flex items-center gap-1.5 text-xs font-semibold text-gray-700">
                      <UserRound size={12} className="text-emerald-500" />
                      {b.assigned_driver_name}
                    </span>
                  ) : (
                    <span className="text-xs text-gray-400">Unassigned</span>
                  )}
                </td>

                <td className="px-4 py-4">
                  <span className={`${mono.className} text-[10px] font-bold uppercase tracking-wider text-gray-600`}>
                    {(b.pickup_days || []).slice(0, 2).map((d) => d.slice(0, 3)).join(" · ") || "—"}
                    {(b.pickup_days || []).length > 2 ? ` +${(b.pickup_days || []).length - 2}` : ""}
                  </span>
                </td>

                <td className="px-4 py-4">
                  <span className="text-xs font-semibold text-gray-700">
                    {formatDate(b.next_collection)}
                  </span>
                </td>

                <td className="px-4 py-4">
                  <BuildingStatusBadge kind="status" value={b.status} size="sm" />
                </td>

                <td className="px-4 py-4">
                  <BuildingStatusBadge kind="payment" value={b.payment_status} size="sm" />
                </td>

                <td className="px-4 py-4 text-right">
                  <ChevronRight
                    size={16}
                    className="ml-auto text-gray-300 transition group-hover:translate-x-0.5 group-hover:text-emerald-500"
                  />
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
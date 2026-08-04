"use client";

import { motion } from "framer-motion";
import { ChevronRight, UserRound } from "lucide-react";
import { Sora, JetBrains_Mono } from "next/font/google";
import TruckStatusBadge from "./TruckStatusBadge";
import type { TruckRecord } from "@/lib/core/company/truckEngine";

const display = Sora({ subsets: ["latin"], display: "swap", variable: "--font-display" });
const mono = JetBrains_Mono({ subsets: ["latin"], display: "swap", variable: "--font-mono" });
const EASE = [0.22, 1, 0.36, 1] as [number, number, number, number];

interface FleetTableProps {
  trucks: TruckRecord[];
  onSelect: (truck: TruckRecord) => void;
}

export default function FleetTable({ trucks, onSelect }: FleetTableProps) {
  return (
    <div className="overflow-hidden rounded-[20px] border border-gray-200/80 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] text-left">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50/60">
              {["Truck", "Spec", "Driver", "Status", "Today", ""].map(
                (header, i) => (
                  <th
                    key={i}
                    className={`px-5 py-3 ${mono.className} text-[10px] font-bold uppercase tracking-[0.18em] text-gray-500`}
                  >
                    {header}
                  </th>
                )
              )}
            </tr>
          </thead>
          <tbody>
            {trucks.map((truck, i) => (
              <motion.tr
                key={truck.truck_id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: i * 0.03, ease: EASE }}
                onClick={() => onSelect(truck)}
                className="group cursor-pointer border-b border-gray-50 transition-colors last:border-0 hover:bg-emerald-50/40"
              >
                <td className="px-5 py-4">
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100">
                      <span className={`${display.className} text-sm font-black`}>
                        {(truck.license_plate || "T").charAt(0).toUpperCase()}
                      </span>
                    </span>
                    <div className="min-w-0">
                      <p className={`${display.className} truncate text-sm font-bold text-gray-900`}>
                        {truck.license_plate || "No plate"}
                      </p>
                      <p className={`${mono.className} text-[10px] font-bold uppercase tracking-wider text-gray-400`}>
                        {truck.truck_id}
                      </p>
                    </div>
                  </div>
                </td>

                <td className="px-5 py-4">
                  <p className="text-xs font-semibold text-gray-700">
                    {truck.truck_type || "N/A"}
                  </p>
                  <p className="text-[11px] font-medium text-gray-400">
                    {truck.capacity || "—"}
                  </p>
                </td>

                <td className="px-5 py-4">
                  {truck.driver_name ? (
                    <span className="flex items-center gap-1.5 text-xs font-semibold text-gray-700">
                      <UserRound size={12} className="text-emerald-500" />
                      {truck.driver_name}
                    </span>
                  ) : (
                    <span className="text-xs text-gray-400">Unassigned</span>
                  )}
                </td>

                <td className="px-5 py-4">
                  <TruckStatusBadge status={truck.status || "idle"} size="sm" />
                </td>

                <td className="px-5 py-4">
                  <span className={`${display.className} text-sm font-black tabular-nums text-emerald-700`}>
                    {truck.collections_today || 0}
                  </span>
                </td>

                <td className="px-5 py-4 text-right">
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
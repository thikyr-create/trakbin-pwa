"use client";

import { motion } from "framer-motion";
import { ChevronRight, TriangleAlert } from "lucide-react";
import { Sora, JetBrains_Mono } from "next/font/google";
import DriverStatusBadge from "./DriverStatusBadge";
import type { DriverPageRecord, TruckOption } from "./DriversPage";

const display = Sora({ subsets: ["latin"], display: "swap", variable: "--font-display" });
const mono = JetBrains_Mono({ subsets: ["latin"], display: "swap", variable: "--font-mono" });
const EASE = [0.22, 1, 0.36, 1] as [number, number, number, number];

interface DriverTableProps {
  drivers: DriverPageRecord[];
  trucks?: TruckOption[];
  openIssues?: Record<string, number>;
  onSelect: (driver: DriverPageRecord) => void;
}

export default function DriverTable({
  drivers,
  trucks = [],
  openIssues = {},
  onSelect,
}: DriverTableProps) {
  const truckLabel = (id?: string | null) =>
    trucks.find((t) => t.id === id)?.label ?? null;

  return (
    <div className="overflow-hidden rounded-[20px] border border-gray-200/80 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] text-left">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50/60">
              {["Driver", "Contact", "Truck", "Status", "Issues", ""].map(
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
            {drivers.map((driver, i) => {
              const name = driver.name || driver.full_name || "Unknown Driver";
              const issues = openIssues[driver.employee_id] || 0;
              const truck = truckLabel(driver.truck_id);

              return (
                <motion.tr
                  key={driver.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: i * 0.03, ease: EASE }}
                  onClick={() => onSelect(driver)}
                  className="group cursor-pointer border-b border-gray-50 transition-colors last:border-0 hover:bg-emerald-50/40"
                >
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100">
                        <span className={`${display.className} text-base font-black`}>
                          {name.charAt(0).toUpperCase()}
                        </span>
                      </span>
                      <div className="min-w-0">
                        <p className={`${display.className} truncate text-sm font-bold text-gray-900`}>
                          {name}
                        </p>
                        <p className={`${mono.className} text-[10px] font-bold uppercase tracking-wider text-gray-400`}>
                          {driver.employee_id}
                        </p>
                      </div>
                    </div>
                  </td>

                  <td className="px-5 py-4">
                    <p className="max-w-[220px] truncate text-xs font-semibold text-gray-600">
                      {driver.email}
                    </p>
                    <p className="text-[11px] font-medium text-gray-400">
                      {driver.phone || "—"}
                    </p>
                  </td>

                  <td className="px-5 py-4">
                    <span className={`text-xs font-semibold ${truck ? "text-gray-700" : "text-gray-400"}`}>
                      {truck ?? "Unassigned"}
                    </span>
                  </td>

                  <td className="px-5 py-4">
                    <DriverStatusBadge status={driver.status} size="sm" />
                  </td>

                  <td className="px-5 py-4">
                    {issues > 0 ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-700 ring-1 ring-amber-200">
                        <TriangleAlert className="h-3 w-3" /> {issues}
                      </span>
                    ) : (
                      <span className="text-xs text-gray-300">—</span>
                    )}
                  </td>

                  <td className="px-5 py-4 text-right">
                    <ChevronRight
                      size={16}
                      className="ml-auto text-gray-300 transition group-hover:translate-x-0.5 group-hover:text-emerald-500"
                    />
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
"use client";

import { motion } from "framer-motion";
import { Users } from "lucide-react";
import { Sora, JetBrains_Mono } from "next/font/google";
import DriverStatusBadge from "../drivers/DriverStatusBadge";

const display = Sora({ subsets: ["latin"], display: "swap", variable: "--font-display" });
const mono = JetBrains_Mono({ subsets: ["latin"], display: "swap", variable: "--font-mono" });
const EASE = [0.22, 1, 0.36, 1] as [number, number, number, number];

export interface DriverRunStats {
  assigned: number;
  completed: number;
}

interface DriverPerformanceTableProps {
  drivers: any[];
  plannedRuns: number;
  /** Future: per-driver run attribution, keyed by employee_id */
  runStats?: Record<string, DriverRunStats>;
}

export default function DriverPerformanceTable({
  drivers,
  plannedRuns,
  runStats,
}: DriverPerformanceTableProps) {
  if (drivers.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-[24px] border border-gray-200/80 bg-white p-10 text-center shadow-sm">
        <Users className="mb-2 h-8 w-8 text-gray-300" />
        <p className="text-sm font-bold text-gray-500">No drivers registered</p>
        <p className="mt-1 text-xs text-gray-400">Driver performance appears once the crew is onboarded.</p>
      </div>
    );
  }

  const hasRunData = plannedRuns > 0 && !!runStats;

  return (
    <div className="overflow-hidden rounded-[24px] border border-gray-200/80 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-gray-100 px-6 py-5">
        <h2 className={`${display.className} text-lg font-extrabold tracking-tight text-gray-900`}>
          Driver performance
        </h2>
        <span className={`${mono.className} text-[11px] font-bold uppercase tracking-wider text-gray-400`}>
          {drivers.length} driver{drivers.length === 1 ? "" : "s"}
        </span>
      </div>

      {!hasRunData && (
        <div className="border-b border-amber-100 bg-amber-50/60 px-6 py-3">
          <p className="text-[11px] font-semibold text-amber-800">
            Assigned / completed counts appear once dispatch links runs to drivers.
            Showing roster and status only.
          </p>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full min-w-[560px] text-left">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50/60">
              {["Driver", "Status", "Assigned", "Completed", "Success rate"].map((h) => (
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
            {drivers.map((d, i) => {
              const stats = runStats?.[d.employee_id];
              const rate =
                stats && stats.assigned > 0
                  ? Math.round((stats.completed / stats.assigned) * 1000) / 10
                  : null;

              return (
                <motion.tr
                  key={d.employee_id || i}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: Math.min(i, 10) * 0.04, ease: EASE }}
                  className="border-b border-gray-50 last:border-0"
                >
                  <td className="px-5 py-4">
                    <p className="text-sm font-bold text-gray-900">{d.full_name || "Unnamed driver"}</p>
                    <p className={`${mono.className} text-[10px] font-semibold uppercase tracking-wider text-gray-400`}>
                      {d.employee_id}
                    </p>
                  </td>

                  <td className="px-5 py-4">
                    <DriverStatusBadge status={d.status || ""} size="sm" />
                  </td>

                  <td className="px-5 py-4">
                    <p className="text-sm font-bold tabular-nums text-gray-900">
                      {stats ? stats.assigned : "—"}
                    </p>
                  </td>

                  <td className="px-5 py-4">
                    <p className="text-sm font-bold tabular-nums text-gray-900">
                      {stats ? stats.completed : "—"}
                    </p>
                  </td>

                  <td className="px-5 py-4">
                    {rate === null ? (
                      <p className="text-sm font-bold text-gray-300">—</p>
                    ) : (
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold ring-1 ${mono.className} ${
                          rate >= 95
                            ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
                            : rate >= 80
                            ? "bg-amber-50 text-amber-700 ring-amber-200"
                            : "bg-red-50 text-red-700 ring-red-200"
                        }`}
                      >
                        {rate}%
                      </span>
                    )}
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
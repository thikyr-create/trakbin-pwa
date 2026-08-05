// app/waste-company-dashboard/components/analytics/FleetSnapshotChart.tsx
"use client";

import { motion } from "framer-motion";
import { Truck } from "lucide-react";
import { Sora, JetBrains_Mono } from "next/font/google";
import type { FleetSnapshot } from "@/lib/core/analytics/metricsEngine";

const display = Sora({ subsets: ["latin"], display: "swap", variable: "--font-display" });
const mono = JetBrains_Mono({ subsets: ["latin"], display: "swap", variable: "--font-mono" });
const EASE = [0.22, 1, 0.36, 1] as [number, number, number, number];

export default function FleetSnapshotChart({ fleet }: { fleet: FleetSnapshot | null }) {
  if (!fleet || fleet.total === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-[24px] border border-gray-200/80 bg-white p-10 text-center shadow-sm">
        <Truck className="mb-2 h-8 w-8 text-gray-300" />
        <p className="text-sm font-bold text-gray-500">No trucks registered</p>
        <p className="mt-1 text-xs text-gray-400">Fleet state appears once trucks are added.</p>
      </div>
    );
  }

  const segments = [
    { label: "On route", value: fleet.onRoute, bar: "bg-emerald-500" },
    { label: "Available", value: fleet.available, bar: "bg-sky-500" },
    { label: "Maintenance", value: fleet.maintenance, bar: "bg-amber-500" },
  ];

  return (
    <div className="rounded-[24px] border border-gray-200/80 bg-white p-6 shadow-sm">
      <div className="mb-5 flex items-center justify-between">
        <h2 className={`${display.className} text-lg font-extrabold tracking-tight text-gray-900`}>
          Fleet snapshot
        </h2>
        <span className={`${mono.className} text-[10px] font-bold uppercase tracking-[0.18em] text-gray-400`}>
          {fleet.total} truck{fleet.total === 1 ? "" : "s"}
        </span>
      </div>

      {/* Stacked composition bar */}
      <div className="mb-5 flex h-3 overflow-hidden rounded-full bg-gray-100">
        {segments.map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ width: 0 }}
            animate={{ width: `${(s.value / fleet.total) * 100}%` }}
            transition={{ duration: 0.7, delay: i * 0.08, ease: EASE }}
            className={`h-full ${s.bar}`}
          />
        ))}
      </div>

      <div className="grid grid-cols-3 gap-2">
        {segments.map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: i * 0.06, ease: EASE }}
            className="rounded-xl bg-gray-50 px-3 py-3 text-center"
          >
            <p className={`${display.className} text-2xl font-extrabold tabular-nums text-gray-900`}>{s.value}</p>
            <p className={`${mono.className} mt-1 text-[9px] font-bold uppercase tracking-wider text-gray-400`}>
              {s.label}
            </p>
          </motion.div>
        ))}
      </div>

      <div className="mt-4 flex items-center justify-between rounded-xl border border-gray-100 bg-gray-50/60 px-4 py-3">
        <span className={`${mono.className} text-[10px] font-bold uppercase tracking-wider text-gray-500`}>
          Utilization (on route now)
        </span>
        <span className={`${display.className} text-lg font-extrabold tabular-nums text-emerald-700`}>
          {fleet.utilizationPct}%
        </span>
      </div>
    </div>
  );
}
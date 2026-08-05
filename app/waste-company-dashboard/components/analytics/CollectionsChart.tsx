// app/waste-company-dashboard/components/analytics/CollectionsChart.tsx
"use client";

import { motion } from "framer-motion";
import { ClipboardList } from "lucide-react";
import { Sora, JetBrains_Mono } from "next/font/google";

const display = Sora({ subsets: ["latin"], display: "swap", variable: "--font-display" });
const mono = JetBrains_Mono({ subsets: ["latin"], display: "swap", variable: "--font-mono" });
const EASE = [0.22, 1, 0.36, 1] as [number, number, number, number];

interface CollectionsChartProps {
  plannedRuns: number;
  plannedStops: number;
  connectedRuns: number;
}

export default function CollectionsChart({
  plannedRuns,
  plannedStops,
  connectedRuns,
}: CollectionsChartProps) {
  const connectivityPct = plannedRuns > 0 ? Math.round((connectedRuns / plannedRuns) * 100) : 0;

  return (
    <div className="rounded-[24px] border border-gray-200/80 bg-white p-6 shadow-sm">
      <div className="mb-6 flex items-center justify-between">
        <h2 className={`${display.className} text-lg font-extrabold tracking-tight text-gray-900`}>
          Collections
        </h2>
        <span className={`${mono.className} text-[10px] font-bold uppercase tracking-[0.18em] text-gray-400`}>
          execution status
        </span>
      </div>

      {plannedRuns === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 text-center">
          <ClipboardList className="mb-2 h-8 w-8 text-gray-300" />
          <p className="text-sm font-bold text-gray-500">No collection runs planned yet</p>
          <p className="mt-1 max-w-xs text-xs text-gray-400">
            Once dispatch assigns routes, run volumes and completion rates appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-5">
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: "Planned runs", value: plannedRuns },
              { label: "Planned stops", value: plannedStops },
              { label: "Connected", value: connectedRuns },
            ].map((s, i) => (
              <motion.div
                key={s.label}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: i * 0.06, ease: EASE }}
                className="rounded-xl bg-gray-50 px-3 py-3 text-center"
              >
                <p className={`${display.className} text-2xl font-extrabold tabular-nums text-gray-900`}>
                  {s.value}
                </p>
                <p className={`${mono.className} mt-1 text-[9px] font-bold uppercase tracking-wider text-gray-400`}>
                  {s.label}
                </p>
              </motion.div>
            ))}
          </div>

          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <span className={`${mono.className} text-[10px] font-bold uppercase tracking-wider text-gray-500`}>
                Route connectivity
              </span>
              <span className={`${display.className} text-sm font-extrabold tabular-nums ${
                connectivityPct === 0 ? "text-red-600" : "text-emerald-700"
              }`}>
                {connectivityPct}%
              </span>
            </div>
            <div className="h-2.5 overflow-hidden rounded-full bg-gray-100">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${connectivityPct}%` }}
                transition={{ duration: 0.7, ease: EASE }}
                className={`h-full rounded-full ${connectivityPct === 0 ? "bg-red-400" : "bg-emerald-500"}`}
              />
            </div>
            {connectivityPct === 0 && (
              <p className="mt-2 text-[11px] font-semibold text-red-600">
                Planned runs are not linked to routes — dispatch needs attention.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
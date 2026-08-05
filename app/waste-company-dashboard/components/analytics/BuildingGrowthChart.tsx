"use client";

import { motion } from "framer-motion";
import { Building2 } from "lucide-react";
import { Sora, JetBrains_Mono } from "next/font/google";
import type { SeriesPoint } from "@/lib/core/analytics/metricsEngine";

const display = Sora({ subsets: ["latin"], display: "swap", variable: "--font-display" });
const mono = JetBrains_Mono({ subsets: ["latin"], display: "swap", variable: "--font-mono" });
const EASE = [0.22, 1, 0.36, 1] as [number, number, number, number];

export default function BuildingGrowthChart({ series }: { series: SeriesPoint[] }) {
  const max = Math.max(...series.map((s) => s.value), 1);
  const hasData = series.some((s) => s.value > 0);

  return (
    <div className="rounded-[24px] border border-gray-200/80 bg-white p-6 shadow-sm">
      <div className="mb-6 flex items-center justify-between">
        <h2 className={`${display.className} text-lg font-extrabold tracking-tight text-gray-900`}>
          Building growth
        </h2>
        <span className={`${mono.className} text-[10px] font-bold uppercase tracking-[0.18em] text-gray-400`}>
          new registrations · 6 months
        </span>
      </div>

      {!hasData ? (
        <div className="flex flex-col items-center justify-center py-10 text-center">
          <Building2 className="mb-2 h-8 w-8 text-gray-300" />
          <p className="text-sm font-bold text-gray-500">No new registrations in this window</p>
          <p className="mt-1 text-xs text-gray-400">Growth appears as buildings join the network.</p>
        </div>
      ) : (
        <div className="flex h-40 items-end gap-3">
          {series.map((s, i) => {
            const pct = Math.max((s.value / max) * 100, s.value > 0 ? 4 : 1);
            return (
              <motion.div
                key={s.month}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.4, delay: i * 0.06, ease: EASE }}
                className="group flex h-full flex-1 flex-col items-center justify-end gap-2"
              >
                <p className={`${display.className} text-[11px] font-bold tabular-nums text-gray-700 opacity-0 transition group-hover:opacity-100`}>
                  {s.value}
                </p>
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: `${pct}%` }}
                  transition={{ duration: 0.6, delay: i * 0.06, ease: EASE }}
                  className={`w-full max-w-[56px] rounded-t-xl transition-colors ${
                    s.value > 0 ? "bg-sky-500 group-hover:bg-sky-600" : "bg-gray-100"
                  }`}
                />
                <p className={`${mono.className} text-[10px] font-bold uppercase tracking-wider text-gray-500`}>
                  {s.label}
                </p>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
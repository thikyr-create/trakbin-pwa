"use client";

import { motion } from "framer-motion";
import { ChartColumn } from "lucide-react";
import { Sora, JetBrains_Mono } from "next/font/google";
import { formatNaira } from "@/lib/utils/money";
import type { MonthlyRevenue } from "@/lib/features/finance/services/financeService";

const display = Sora({ subsets: ["latin"], display: "swap", variable: "--font-display" });
const mono = JetBrains_Mono({ subsets: ["latin"], display: "swap", variable: "--font-mono" });
const EASE = [0.22, 1, 0.36, 1] as [number, number, number, number];

interface RevenueChartProps {
  series: MonthlyRevenue[];
}

export default function RevenueChart({ series }: RevenueChartProps) {
  const max = Math.max(...series.map((m) => m.revenue), 1);
  const hasData = series.some((m) => m.revenue > 0);

  if (!hasData) {
    return (
      <div className="flex flex-col items-center justify-center rounded-[24px] border border-gray-200/80 bg-white p-10 text-center shadow-sm">
        <ChartColumn className="mb-2 h-8 w-8 text-gray-300" />
        <p className="text-sm font-bold text-gray-500">No confirmed revenue yet</p>
        <p className="mt-1 text-xs text-gray-400">
          Monthly revenue appears here once receipts are issued.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-[24px] border border-gray-200/80 bg-white p-6 shadow-sm">
      <div className="mb-6 flex items-center justify-between">
        <h2 className={`${display.className} text-lg font-extrabold tracking-tight text-gray-900`}>
          Revenue
        </h2>
        <span className={`${mono.className} text-[10px] font-bold uppercase tracking-[0.18em] text-gray-400`}>
          Last 6 months · confirmed
        </span>
      </div>

      <div className="flex h-44 items-end gap-3">
        {series.map((m, i) => {
          const pct = Math.max((m.revenue / max) * 100, m.revenue > 0 ? 4 : 1);
          return (
            <motion.div
              key={m.month}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4, delay: i * 0.06, ease: EASE }}
              className="group flex h-full flex-1 flex-col items-center justify-end gap-2"
            >
              <p className={`${display.className} text-[11px] font-bold tabular-nums text-gray-700 opacity-0 transition group-hover:opacity-100`}>
                {formatNaira(m.revenue)}
              </p>

              <motion.div
                initial={{ height: 0 }}
                animate={{ height: `${pct}%` }}
                transition={{ duration: 0.6, delay: i * 0.06, ease: EASE }}
                className={`w-full max-w-[56px] rounded-t-xl transition-colors ${
                  m.revenue > 0
                    ? "bg-emerald-500 group-hover:bg-emerald-600"
                    : "bg-gray-100"
                }`}
              />

              <div className="text-center">
                <p className={`${mono.className} text-[10px] font-bold uppercase tracking-wider text-gray-500`}>
                  {m.label.split(" ")[0]}
                </p>
                <p className={`${mono.className} text-[9px] font-semibold text-gray-300`}>
                  {m.collections} coll.
                </p>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
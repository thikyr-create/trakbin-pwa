// app/waste-company-dashboard/components/analytics/PaymentStatusChart.tsx
"use client";

import { motion } from "framer-motion";
import { FileText } from "lucide-react";
import { Sora, JetBrains_Mono } from "next/font/google";
import type { PaymentDistribution } from "@/lib/core/analytics/metricsEngine";

const display = Sora({ subsets: ["latin"], display: "swap", variable: "--font-display" });
const mono = JetBrains_Mono({ subsets: ["latin"], display: "swap", variable: "--font-mono" });
const EASE = [0.22, 1, 0.36, 1] as [number, number, number, number];

export default function PaymentStatusChart({ dist }: { dist: PaymentDistribution | null }) {
  if (!dist || dist.total === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-[24px] border border-gray-200/80 bg-white p-10 text-center shadow-sm">
        <FileText className="mb-2 h-8 w-8 text-gray-300" />
        <p className="text-sm font-bold text-gray-500">No invoices issued yet</p>
        <p className="mt-1 text-xs text-gray-400">Payment distribution appears after the first billing run.</p>
      </div>
    );
  }

  const rows = [
    { label: "Paid", value: dist.paid, bar: "bg-emerald-500" },
    { label: "Open", value: dist.open, bar: "bg-sky-500" },
    { label: "Overdue", value: dist.overdue, bar: "bg-red-500" },
    { label: "Cancelled", value: dist.cancelled, bar: "bg-gray-300" },
  ];

  return (
    <div className="rounded-[24px] border border-gray-200/80 bg-white p-6 shadow-sm">
      <div className="mb-5 flex items-center justify-between">
        <h2 className={`${display.className} text-lg font-extrabold tracking-tight text-gray-900`}>
          Payment status
        </h2>
        <span className={`${mono.className} text-[10px] font-bold uppercase tracking-[0.18em] text-gray-400`}>
          {dist.total} invoice{dist.total === 1 ? "" : "s"}
        </span>
      </div>

      <div className="space-y-4">
        {rows.map((r, i) => {
          const pct = Math.round((r.value / dist.total) * 100);
          return (
            <motion.div
              key={r.label}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.35, delay: i * 0.06, ease: EASE }}
            >
              <div className="mb-1.5 flex items-center justify-between">
                <span className="text-xs font-bold text-gray-700">{r.label}</span>
                <span className="text-xs font-bold tabular-nums text-gray-900">
                  {r.value}
                  <span className={`${mono.className} ml-1.5 text-[10px] font-semibold text-gray-400`}>{pct}%</span>
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-gray-100">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${pct}%` }}
                  transition={{ duration: 0.7, delay: i * 0.06, ease: EASE }}
                  className={`h-full rounded-full ${r.bar}`}
                />
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
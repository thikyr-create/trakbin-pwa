"use client";

import { motion } from "framer-motion";
import {
  Building2, ClipboardCheck, Target, TrendingUp,
  TriangleAlert, Users, Truck, Flag,
} from "lucide-react";
import { Sora, JetBrains_Mono } from "next/font/google";
import { formatNaira } from "@/lib/utils/money";
import type { AnalyticsKpis } from "@/lib/core/analytics/metricsEngine";

const display = Sora({ subsets: ["latin"], display: "swap", variable: "--font-display" });
const mono = JetBrains_Mono({ subsets: ["latin"], display: "swap", variable: "--font-mono" });
const EASE = [0.22, 1, 0.36, 1] as [number, number, number, number];

interface KPIGridProps {
  kpis: AnalyticsKpis | null;
  loading?: boolean;
  executionGap?: boolean;
}

export default function KPIGrid({ kpis, loading, executionGap }: KPIGridProps) {
  if (loading || !kpis) {
    return (
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="h-24 animate-pulse rounded-2xl bg-gray-200/60" />
        ))}
      </div>
    );
  }

  const cards = [
    { Icon: Building2, label: "Buildings served", value: String(kpis.buildingsServed), tile: "bg-emerald-50 text-emerald-600", accent: "text-emerald-700" },
    {
      Icon: ClipboardCheck,
      label: "Collections completed",
      value: executionGap ? "—" : String(kpis.collectionsCompleted),
      note: executionGap ? "awaiting dispatch" : undefined,
      tile: "bg-sky-50 text-sky-600",
      accent: "text-sky-700",
    },
    {
      Icon: Target,
      label: "Success rate",
      value: kpis.collectionSuccessRate === null ? "—" : `${kpis.collectionSuccessRate}%`,
      note: kpis.collectionSuccessRate === null ? "no runs to measure" : undefined,
      tile: "bg-violet-50 text-violet-600",
      accent: "text-violet-700",
    },
    { Icon: TrendingUp, label: "Revenue (period)", value: formatNaira(kpis.revenue), tile: "bg-emerald-50 text-emerald-600", accent: "text-emerald-700" },
    { Icon: TriangleAlert, label: "Outstanding", value: formatNaira(kpis.outstanding), tile: "bg-amber-50 text-amber-600", accent: "text-amber-700" },
    { Icon: Users, label: "Active drivers", value: String(kpis.activeDrivers), tile: "bg-gray-100 text-gray-600", accent: "text-gray-900" },
    { Icon: Truck, label: "Fleet utilization", value: `${kpis.fleetUtilization}%`, tile: "bg-sky-50 text-sky-600", accent: "text-sky-700" },
    { Icon: Flag, label: "Issue reports", value: String(kpis.issueReports), tile: "bg-red-50 text-red-500", accent: "text-red-600" },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {cards.map((c, i) => {
        const Icon = c.Icon;
        return (
          <motion.div
            key={c.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: i * 0.05, ease: EASE }}
            whileHover={{ y: -3 }}
            className="rounded-2xl border border-gray-200/80 bg-white p-4 shadow-sm"
          >
            <div className="mb-3 flex items-center justify-between">
              <span className={`flex h-9 w-9 items-center justify-center rounded-xl ${c.tile}`}>
                <Icon size={16} />
              </span>
            </div>
            <p className={`${display.className} text-xl font-extrabold leading-tight tabular-nums ${c.accent}`}>
              {c.value}
            </p>
            <p className={`${mono.className} mt-1 text-[9px] font-bold uppercase tracking-[0.16em] text-gray-400`}>
              {c.label}
            </p>
            {c.note && (
              <p className={`${mono.className} mt-0.5 text-[8px] font-semibold uppercase tracking-wider text-gray-300`}>
                {c.note}
              </p>
            )}
          </motion.div>
        );
      })}
    </div>
  );
}
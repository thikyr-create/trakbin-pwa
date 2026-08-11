"use client";

import { motion } from "framer-motion";
import { TrendingUp, CalendarDays, TriangleAlert, Clock, Wallet } from "lucide-react";
import { Sora, JetBrains_Mono } from "next/font/google";
import { formatNaira } from "@/lib/utils/money";
import type { FinanceOverview } from "@/lib/features/finance/services/financeService";

const display = Sora({ subsets: ["latin"], display: "swap", variable: "--font-display" });
const mono = JetBrains_Mono({ subsets: ["latin"], display: "swap", variable: "--font-mono" });
const EASE = [0.22, 1, 0.36, 1] as [number, number, number, number];

interface RevenueCardsProps {
  overview: FinanceOverview | null;
  available: number;
  loading?: boolean;
}

export default function RevenueCards({ overview, available, loading }: RevenueCardsProps) {
  if (loading || !overview) {
    return (
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        {[0, 1, 2, 3, 4].map((i) => (
          <div key={i} className="h-24 animate-pulse rounded-2xl bg-gray-200/60" />
        ))}
      </div>
    );
  }

  const cards = [
    { Icon: TrendingUp, label: "Total revenue", value: overview.totalRevenue, tile: "bg-emerald-50 text-emerald-600", accent: "text-emerald-700" },
    { Icon: CalendarDays, label: "Collected this month", value: overview.collectedThisMonth, tile: "bg-sky-50 text-sky-600", accent: "text-sky-700" },
    { Icon: TriangleAlert, label: "Outstanding", value: overview.outstanding, tile: "bg-amber-50 text-amber-600", accent: "text-amber-700" },
    { Icon: Clock, label: "Pending settlement", value: overview.pendingSettlement, tile: "bg-gray-100 text-gray-500", accent: "text-gray-700" },
    { Icon: Wallet, label: "Available balance", value: available, tile: "bg-emerald-50 text-emerald-600", accent: "text-emerald-700" },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
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
              {formatNaira(c.value)}
            </p>
            <p className={`${mono.className} mt-1 text-[9px] font-bold uppercase tracking-[0.16em] text-gray-400`}>
              {c.label}
            </p>
          </motion.div>
        );
      })}
    </div>
  );
}
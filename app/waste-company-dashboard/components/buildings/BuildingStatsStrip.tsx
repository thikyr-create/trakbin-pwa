"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { Building2, CircleCheck, Clock3, CreditCard } from "lucide-react";
import { Sora, JetBrains_Mono } from "next/font/google";
import type { BuildingRecord } from "@/lib/features/buildings/services/buildingService";

const display = Sora({ subsets: ["latin"], display: "swap", variable: "--font-display" });
const mono = JetBrains_Mono({ subsets: ["latin"], display: "swap", variable: "--font-mono" });
const EASE = [0.22, 1, 0.36, 1] as [number, number, number, number];

interface BuildingStatsStripProps {
  buildings: BuildingRecord[];
}

export default function BuildingStatsStrip({ buildings }: BuildingStatsStripProps) {
  const stats = useMemo(() => {
    const total = buildings.length;
    const active = buildings.filter((b) => b.status === "active").length;
    const pending = buildings.filter((b) => b.status === "pending").length;
    const unpaid = buildings.filter(
      (b) => (b.payment_status || "") !== "paid"
    ).length;

    return [
      { Icon: Building2, label: "Buildings served", value: total, accent: "text-emerald-700", tile: "bg-emerald-50 text-emerald-600" },
      { Icon: CircleCheck, label: "Active", value: active, accent: "text-emerald-700", tile: "bg-emerald-50 text-emerald-600" },
      { Icon: Clock3, label: "Pending", value: pending, accent: "text-amber-700", tile: "bg-amber-50 text-amber-600" },
      { Icon: CreditCard, label: "Not paid", value: unpaid, accent: "text-red-700", tile: "bg-red-50 text-red-600" },
    ];
  }, [buildings]);

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {stats.map((s, i) => {
        const Icon = s.Icon;
        return (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: i * 0.05, ease: EASE }}
            className="flex items-center gap-3 rounded-[20px] border border-gray-200/80 bg-white p-4 shadow-sm"
          >
            <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${s.tile}`}>
              <Icon size={18} />
            </span>
            <div className="min-w-0">
              <p className={`${display.className} text-2xl font-black leading-none tabular-nums ${s.accent}`}>
                {s.value}
              </p>
              <p className={`${mono.className} mt-1 text-[9px] font-bold uppercase tracking-[0.16em] text-gray-400`}>
                {s.label}
              </p>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
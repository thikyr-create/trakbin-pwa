"use client";

import { motion } from "framer-motion";
import { JetBrains_Mono } from "next/font/google";
import type { RangePreset } from "@/lib/features/analytics/hooks/useAnalytics";

const mono = JetBrains_Mono({ subsets: ["latin"], display: "swap", variable: "--font-mono" });
const EASE = [0.22, 1, 0.36, 1] as [number, number, number, number];

const PRESETS: Array<{ id: RangePreset; label: string }> = [
  { id: "today", label: "Today" },
  { id: "week", label: "7 days" },
  { id: "month", label: "30 days" },
  { id: "year", label: "Year" },
];

interface AnalyticsFiltersProps {
  preset: RangePreset;
  onChange: (preset: RangePreset) => void;
}

export default function AnalyticsFilters({ preset, onChange }: AnalyticsFiltersProps) {
  return (
    <div className="inline-flex items-center rounded-2xl border border-gray-200/80 bg-white p-1.5 shadow-sm">
      {PRESETS.map((p) => {
        const active = preset === p.id;
        return (
          <button
            key={p.id}
            onClick={() => onChange(p.id)}
            className={`relative rounded-xl px-4 py-2 text-[11px] font-bold uppercase tracking-wider transition-colors ${
              active ? "text-white" : "text-gray-500 hover:text-gray-800"
            } ${mono.className}`}
          >
            {active && (
              <motion.span
                layoutId="analytics-preset"
                className="absolute inset-0 rounded-xl bg-emerald-600 shadow-md shadow-emerald-200"
                transition={{ type: "spring", stiffness: 400, damping: 32 }}
              />
            )}
            <span className="relative z-10">{p.label}</span>
          </button>
        );
      })}
    </div>
  );
}
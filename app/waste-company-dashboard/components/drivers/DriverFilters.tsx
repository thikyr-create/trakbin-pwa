"use client";

import { motion } from "framer-motion";
import { TriangleAlert } from "lucide-react";
import { JetBrains_Mono } from "next/font/google";
import { DRIVER_STATUS_OPTIONS } from "./DriverStatusBadge";

const mono = JetBrains_Mono({ subsets: ["latin"], display: "swap", variable: "--font-mono" });

export interface DriverFilterState {
  status: string; // "all" or a status key
  issuesOnly: boolean;
}

export const DEFAULT_DRIVER_FILTERS: DriverFilterState = {
  status: "all",
  issuesOnly: false,
};

interface DriverFiltersProps {
  value: DriverFilterState;
  onChange: (next: DriverFilterState) => void;
  counts?: Record<string, number>;
  issuesCount?: number;
}

export default function DriverFilters({
  value,
  onChange,
  counts,
  issuesCount = 0,
}: DriverFiltersProps) {
  const chips = [{ value: "all", label: "All" }, ...DRIVER_STATUS_OPTIONS];

  return (
    <div className="flex flex-wrap items-center gap-2">
      {chips.map((chip) => {
        const active = value.status === chip.value;
        const count =
          chip.value === "all" ? undefined : counts?.[chip.value] ?? 0;

        return (
          <motion.button
            key={chip.value}
            whileTap={{ scale: 0.96 }}
            onClick={() => onChange({ ...value, status: chip.value })}
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider transition ${
              active
                ? "bg-emerald-600 text-white shadow-md shadow-emerald-200"
                : "bg-white text-gray-600 ring-1 ring-gray-200 hover:ring-emerald-300"
            } ${mono.className}`}
          >
            {chip.label}
            {typeof count === "number" && count > 0 && (
              <span
                className={`rounded-full px-1.5 text-[9px] ${
                  active ? "bg-white/20 text-white" : "bg-gray-100 text-gray-500"
                }`}
              >
                {count}
              </span>
            )}
          </motion.button>
        );
      })}

      <span className="mx-1 hidden h-5 w-px bg-gray-200 sm:block" />

      <motion.button
        whileTap={{ scale: 0.96 }}
        onClick={() => onChange({ ...value, issuesOnly: !value.issuesOnly })}
        className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider transition ${
          value.issuesOnly
            ? "bg-amber-100 text-amber-800 ring-1 ring-amber-300"
            : "bg-white text-gray-600 ring-1 ring-gray-200 hover:ring-amber-300"
        } ${mono.className}`}
      >
        <TriangleAlert size={12} />
        Open issues
        {issuesCount > 0 && (
          <span className="rounded-full bg-amber-200/70 px-1.5 text-[9px] text-amber-800">
            {issuesCount}
          </span>
        )}
      </motion.button>
    </div>
  );
}
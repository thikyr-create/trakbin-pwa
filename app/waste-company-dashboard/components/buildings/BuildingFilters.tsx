"use client";

import { RotateCcw } from "lucide-react";
import { JetBrains_Mono } from "next/font/google";
import { WEEKDAYS } from "@/lib/features/buildings/utils/buildingHelpers";
import {
  buildingStatusMeta,
  paymentStatusMeta,
} from "@/lib/core/building/BuildingStatus";
import type {
  BuildingFilterState,
  BuildingFilterCounts,
} from "@/lib/features/buildings/hooks/useBuildingFilters";

const mono = JetBrains_Mono({ subsets: ["latin"], display: "swap", variable: "--font-mono" });

interface BuildingFiltersProps {
  filters: BuildingFilterState;
  onChange: (next: BuildingFilterState) => void;
  counts: BuildingFilterCounts;
  activeCount: number;
  onReset: () => void;
}

const selectClasses =
  "rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-[11px] font-bold uppercase tracking-wider text-gray-600 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100";

export default function BuildingFilters({
  filters,
  onChange,
  counts,
  activeCount,
  onReset,
}: BuildingFiltersProps) {
  const set = (key: keyof BuildingFilterState, value: string) =>
    onChange({ ...filters, [key]: value });

  const statusKeys = Object.keys(counts.status);
  const paymentKeys = Object.keys(counts.payment);
  const zoneKeys = Object.keys(counts.zone).sort();
  const typeKeys = Object.keys(counts.type).sort();
  const driverKeys = Object.keys(counts.driver).sort();
  const dayKeys = WEEKDAYS.filter((d) => (counts.day[d] || 0) > 0);

  return (
    <div className="flex flex-wrap items-center gap-2">
      <select
        value={filters.status}
        onChange={(e) => set("status", e.target.value)}
        className={selectClasses}
        aria-label="Filter by status"
      >
        <option value="all">Status · All</option>
        {statusKeys.map((k) => (
          <option key={k} value={k}>
            {buildingStatusMeta(k).label} ({counts.status[k]})
          </option>
        ))}
      </select>

      <select
        value={filters.payment}
        onChange={(e) => set("payment", e.target.value)}
        className={selectClasses}
        aria-label="Filter by payment"
      >
        <option value="all">Payment · All</option>
        {paymentKeys.map((k) => (
          <option key={k} value={k}>
            {paymentStatusMeta(k).label} ({counts.payment[k]})
          </option>
        ))}
      </select>

      <select
        value={filters.zone}
        onChange={(e) => set("zone", e.target.value)}
        className={selectClasses}
        aria-label="Filter by zone"
      >
        <option value="all">Zone · All</option>
        {zoneKeys.map((k) => (
          <option key={k} value={k}>
            {k} ({counts.zone[k]})
          </option>
        ))}
      </select>

      <select
        value={filters.day}
        onChange={(e) => set("day", e.target.value)}
        className={selectClasses}
        aria-label="Filter by collection day"
      >
        <option value="all">Day · All</option>
        {dayKeys.map((k) => (
          <option key={k} value={k}>
            {k} ({counts.day[k]})
          </option>
        ))}
      </select>

      <select
        value={filters.driver}
        onChange={(e) => set("driver", e.target.value)}
        className={selectClasses}
        aria-label="Filter by driver"
      >
        <option value="all">Driver · All</option>
        <option value="unassigned">Unassigned ({counts.unassignedDrivers})</option>
        {driverKeys.map((k) => (
          <option key={k} value={k}>
            {k} ({counts.driver[k]})
          </option>
        ))}
      </select>

      <select
        value={filters.type}
        onChange={(e) => set("type", e.target.value)}
        className={selectClasses}
        aria-label="Filter by building type"
      >
        <option value="all">Type · All</option>
        {typeKeys.map((k) => (
          <option key={k} value={k}>
            {k} ({counts.type[k]})
          </option>
        ))}
      </select>

      {activeCount > 0 && (
        <button
          onClick={onReset}
          className={`inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-2.5 py-1.5 text-[11px] font-bold uppercase tracking-wider text-white shadow-md shadow-emerald-200 transition hover:bg-emerald-700 ${mono.className}`}
        >
          <RotateCcw size={12} />
          Reset ({activeCount})
        </button>
      )}
    </div>
  );
}
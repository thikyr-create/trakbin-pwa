// app/waste-company-dashboard/components/finance/FinanceFilters.tsx
"use client";

import { RotateCcw } from "lucide-react";
import { JetBrains_Mono } from "next/font/google";

const mono = JetBrains_Mono({ subsets: ["latin"], display: "swap", variable: "--font-mono" });

const TYPE_OPTIONS = [
  { id: "all", label: "All" },
  { id: "receipt", label: "Receipts" },
  { id: "payment", label: "Attempts" },
  { id: "settlement", label: "Settlements" },
];

const STATUS_OPTIONS = [
  { id: "all", label: "Any status" },
  { id: "successful", label: "Successful" },
  { id: "pending", label: "Pending" },
  { id: "failed", label: "Failed" },
  { id: "settled", label: "Settled" },
];

interface FinanceFiltersProps {
  type: string;
  status: string;
  onTypeChange: (v: string) => void;
  onStatusChange: (v: string) => void;
  activeCount: number;
  onReset: () => void;
}

export default function FinanceFilters({
  type,
  status,
  onTypeChange,
  onStatusChange,
  activeCount,
  onReset,
}: FinanceFiltersProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="flex flex-wrap gap-1.5">
        {TYPE_OPTIONS.map((o) => (
          <button
            key={o.id}
            onClick={() => onTypeChange(o.id)}
            className={`rounded-lg px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider transition ${
              type === o.id
                ? "bg-emerald-600 text-white"
                : "bg-gray-50 text-gray-500 ring-1 ring-gray-200 hover:ring-emerald-300"
            } ${mono.className}`}
          >
            {o.label}
          </button>
        ))}
      </div>

      <select
        value={status}
        onChange={(e) => onStatusChange(e.target.value)}
        className="rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-[11px] font-bold uppercase tracking-wider text-gray-600 outline-none transition focus:border-emerald-400"
        aria-label="Filter by status"
      >
        {STATUS_OPTIONS.map((o) => (
          <option key={o.id} value={o.id}>
            {o.label}
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
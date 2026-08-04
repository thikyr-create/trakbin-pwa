"use client";

import { UserRound } from "lucide-react";
import { Sora, JetBrains_Mono } from "next/font/google";

const display = Sora({ subsets: ["latin"], display: "swap", variable: "--font-display" });
const mono = JetBrains_Mono({ subsets: ["latin"], display: "swap", variable: "--font-mono" });

interface AssignedDriverCardProps {
  driverName: string | null;
  zoneName?: string | null;
}

export default function AssignedDriverCard({ driverName, zoneName }: AssignedDriverCardProps) {
  if (!driverName) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-gray-50/50 p-6 text-center">
        <UserRound className="mb-2 h-7 w-7 text-gray-300" />
        <p className="text-sm font-bold text-gray-500">No driver on this building</p>
        <p className="mt-1 text-[11px] font-medium text-gray-400">
          Drivers appear here once a route covering this building is active.
        </p>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-4 rounded-2xl border border-emerald-100 bg-emerald-50/60 p-4">
      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200">
        <span className={`${display.className} text-xl font-black`}>
          {driverName.charAt(0).toUpperCase()}
        </span>
      </span>
      <div className="min-w-0">
        <p className={`${mono.className} text-[9px] font-bold uppercase tracking-[0.18em] text-emerald-600`}>
          Assigned driver{zoneName ? ` · ${zoneName}` : ""}
        </p>
        <p className={`${display.className} truncate text-sm font-black text-gray-900`}>
          {driverName}
        </p>
        <p className="text-[11px] font-medium text-gray-500">
          Via active route covering this building
        </p>
      </div>
    </div>
  );
}
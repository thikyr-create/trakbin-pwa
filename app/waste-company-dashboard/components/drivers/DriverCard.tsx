"use client";

import { motion } from "framer-motion";
import { Phone, Mail, TriangleAlert, Truck } from "lucide-react";
import { Sora, JetBrains_Mono } from "next/font/google";
import type { DriverPageRecord } from "./DriversPage";

const display = Sora({ subsets: ["latin"], display: "swap", variable: "--font-display" });
const mono = JetBrains_Mono({ subsets: ["latin"], display: "swap", variable: "--font-mono" });
const EASE = [0.22, 1, 0.36, 1] as [number, number, number, number];

interface DriverCardProps {
  driver: DriverPageRecord;
  openIssuesCount: number;
  onClick: () => void;
  index: number;
}

export default function DriverCard({ driver, openIssuesCount, onClick, index }: DriverCardProps) {
  const displayName = driver.name || driver.full_name || "Unknown Driver";
  const initials = displayName.charAt(0).toUpperCase();

  return (
    <motion.button
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.03, ease: EASE }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="group relative flex flex-col overflow-hidden rounded-[20px] border border-gray-200/80 bg-white p-5 text-left shadow-sm transition-shadow hover:border-emerald-200 hover:shadow-lg hover:shadow-emerald-100/50"
    >
      {/* Ambient Background Glow on Hover */}
      <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-emerald-100 opacity-0 blur-2xl transition-opacity duration-500 group-hover:opacity-50" />

      <div className="relative mb-4 flex items-start justify-between">
        <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100 transition group-hover:bg-emerald-100">
          <span className={`${display.className} text-xl font-black`}>{initials}</span>
        </span>

        {openIssuesCount > 0 ? (
          <span className="flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-amber-700 ring-1 ring-amber-200">
            <TriangleAlert className="h-3 w-3" /> {openIssuesCount} open
          </span>
        ) : (
          <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-700 ring-1 ring-emerald-200">
            Active
          </span>
        )}
      </div>

      <div className="relative space-y-1">
        <h3 className={`${display.className} text-lg font-black tracking-tight text-gray-900`}>
          {displayName}
        </h3>
        <p className={`${mono.className} text-[11px] font-bold uppercase tracking-wider text-gray-400`}>
          ID · {driver.employee_id}
        </p>
      </div>

      <div className="relative mt-4 space-y-2 border-t border-gray-100 pt-4">
        <p className="flex items-center gap-2 text-xs font-semibold text-gray-600">
          <Phone size={13} className="text-gray-400" />
          {driver.phone || "No phone provided"}
        </p>
        <p className="flex items-center gap-2 truncate text-xs font-semibold text-gray-600">
          <Mail size={13} className="text-gray-400" />
          {driver.email}
        </p>
        {driver.truck_id && (
          <p className="flex items-center gap-2 truncate text-xs font-semibold text-gray-500">
            <Truck size={13} className="text-gray-400" />
            Assigned to truck
          </p>
        )}
      </div>
    </motion.button>
  );
}
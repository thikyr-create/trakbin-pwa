"use client";

import { motion } from "framer-motion";
import { ChevronRight, PartyPopper } from "lucide-react";
import { Sora, JetBrains_Mono } from "next/font/google";
import BuildingStatusBadge from "../buildings/BuildingStatusBadge";
import { formatNaira } from "@/lib/utils/money";
import type { OutstandingBill } from "@/lib/features/finance/services/financeService";

const display = Sora({ subsets: ["latin"], display: "swap", variable: "--font-display" });
const mono = JetBrains_Mono({ subsets: ["latin"], display: "swap", variable: "--font-mono" });
const EASE = [0.22, 1, 0.36, 1] as [number, number, number, number];

interface OutstandingBillsTableProps {
  bills: OutstandingBill[];
  onViewBuilding?: (customId: string) => void;
}

function formatDate(value?: string | null): string {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-NG", { day: "numeric", month: "short" });
}

function isOverdue(value?: string | null): boolean {
  if (!value) return false;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return false;
  return d.getTime() < Date.now();
}

export default function OutstandingBillsTable({ bills, onViewBuilding }: OutstandingBillsTableProps) {
  if (bills.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-[24px] border border-gray-200/80 bg-white p-10 text-center shadow-sm">
        <PartyPopper className="mb-2 h-8 w-8 text-emerald-300" />
        <p className="text-sm font-bold text-gray-700">No outstanding bills</p>
        <p className="mt-1 text-xs text-gray-400">Every building is in good standing.</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-[24px] border border-gray-200/80 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-gray-100 px-6 py-5">
        <h2 className={`${display.className} text-lg font-extrabold tracking-tight text-gray-900`}>
          Outstanding bills
        </h2>
        <span className={`${mono.className} text-[11px] font-bold uppercase tracking-wider text-gray-400`}>
          {bills.length} building{bills.length === 1 ? "" : "s"}
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-left">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50/60">
              {["Building", "Address", "Amount", "Due", "Status", ""].map((h, i) => (
                <th
                  key={i}
                  className={`px-5 py-3 ${mono.className} text-[10px] font-bold uppercase tracking-[0.18em] text-gray-500`}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {bills.map((b, i) => {
              const overdue = isOverdue(b.due_date);
              return (
                <motion.tr
                  key={b.custom_id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: Math.min(i, 10) * 0.04, ease: EASE }}
                  onClick={() => onViewBuilding?.(b.custom_id)}
                  className={`group border-b border-gray-50 transition-colors last:border-0 ${
                    onViewBuilding ? "cursor-pointer hover:bg-emerald-50/40" : ""
                  }`}
                >
                  <td className="px-5 py-4">
                    <p className={`${mono.className} text-xs font-bold uppercase tracking-wider text-gray-900`}>
                      {b.custom_id}
                    </p>
                  </td>

                  <td className="max-w-[200px] px-5 py-4">
                    <p className="truncate text-xs font-semibold text-gray-700">{b.address || "No address"}</p>
                    <p className="truncate text-[11px] font-medium text-gray-400">{b.estate || "—"}</p>
                  </td>

                  <td className="px-5 py-4">
                    <p className={`${display.className} text-sm font-black tabular-nums text-gray-900`}>
                      {formatNaira(b.amount)}
                    </p>
                  </td>

                  <td className="px-5 py-4">
                    <p className={`text-xs font-bold ${overdue ? "text-red-600" : "text-gray-600"}`}>
                      {formatDate(b.due_date)}
                    </p>
                    {overdue && (
                      <p className={`${mono.className} text-[9px] font-bold uppercase tracking-wider text-red-500`}>
                        Overdue
                      </p>
                    )}
                  </td>

                  <td className="px-5 py-4">
                    <BuildingStatusBadge kind="payment" value={b.status} size="sm" />
                  </td>

                  <td className="px-5 py-4 text-right">
                    <ChevronRight
                      size={16}
                      className="ml-auto text-gray-300 transition group-hover:translate-x-0.5 group-hover:text-emerald-500"
                    />
                  </td>
                </motion.tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
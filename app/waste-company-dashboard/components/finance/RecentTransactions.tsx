"use client";

import { motion } from "framer-motion";
import { Receipt, CreditCard, Landmark, Inbox } from "lucide-react";
import { Sora, JetBrains_Mono } from "next/font/google";
import { formatNaira } from "@/lib/utils/money";
import {
  paymentStatusMeta,
  ledgerStatusMeta,
} from "@/lib/core/finance/FinanceStatus";
import type { Transaction } from "@/lib/features/finance/services/financeService";

const display = Sora({ subsets: ["latin"], display: "swap", variable: "--font-display" });
const mono = JetBrains_Mono({ subsets: ["latin"], display: "swap", variable: "--font-mono" });
const EASE = [0.22, 1, 0.36, 1] as [number, number, number, number];

const TYPE_STYLE: Record<
  Transaction["type"],
  { Icon: any; tile: string }
> = {
  receipt: { Icon: Receipt, tile: "bg-emerald-50 text-emerald-600" },
  payment: { Icon: CreditCard, tile: "bg-amber-50 text-amber-600" },
  settlement: { Icon: Landmark, tile: "bg-sky-50 text-sky-600" },
};

interface RecentTransactionsProps {
  transactions: Transaction[];
  onOpenTransaction?: (tx: Transaction) => void;
}

function formatDate(value: string): string {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-NG", { day: "numeric", month: "short" });
}

export default function RecentTransactions({
  transactions,
  onOpenTransaction,
}: RecentTransactionsProps) {
  if (transactions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-[24px] border border-gray-200/80 bg-white p-10 text-center shadow-sm">
        <Inbox className="mb-2 h-8 w-8 text-gray-300" />
        <p className="text-sm font-bold text-gray-500">No transactions yet</p>
        <p className="mt-1 text-xs text-gray-400">
          Receipts, payment attempts and settlements will appear here.
        </p>
      </div>
    );
  }

  const visible = transactions.slice(0, 12);

  return (
    <div className="overflow-hidden rounded-[24px] border border-gray-200/80 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-gray-100 px-6 py-5">
        <h2 className={`${display.className} text-lg font-extrabold tracking-tight text-gray-900`}>
          Recent transactions
        </h2>
        <span className={`${mono.className} text-[11px] font-bold uppercase tracking-wider text-gray-400`}>
          latest {visible.length} of {transactions.length}
        </span>
      </div>

      <ul className="divide-y divide-gray-50">
        {visible.map((tx, i) => {
          const style = TYPE_STYLE[tx.type];
          const Icon = style.Icon;
          const meta =
            tx.type === "settlement"
              ? ledgerStatusMeta(tx.status)
              : paymentStatusMeta(tx.status);

          return (
            <motion.li
              key={`${tx.type}-${tx.id}`}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: Math.min(i, 10) * 0.04, ease: EASE }}
              onClick={() => onOpenTransaction?.(tx)}
              className={`flex items-center gap-4 px-6 py-4 transition-colors ${
                onOpenTransaction ? "cursor-pointer hover:bg-emerald-50/40" : ""
              }`}
            >
              <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${style.tile}`}>
                <Icon size={17} />
              </span>

              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold text-gray-900">
                  {tx.building_id || "Company settlement"}
                </p>
                <p className="truncate text-[11px] font-medium text-gray-400">
                  {formatDate(tx.created_at)}
                  {tx.building_address ? ` · ${tx.building_address}` : ""}
                  {tx.provider ? ` · ${tx.provider}` : ""}
                  {tx.method ? ` · ${tx.method}` : ""}
                </p>
              </div>

              <div className="flex shrink-0 items-center gap-3">
                <p
                  className={`${display.className} text-sm font-black tabular-nums ${
                    tx.status === "failed" ? "text-gray-400 line-through" : "text-gray-900"
                  }`}
                >
                  {formatNaira(tx.amount)}
                </p>
                <span
                  className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ring-1 ${meta.classes} ${mono.className}`}
                >
                  <span className={`h-1.5 w-1.5 rounded-full ${meta.dot}`} />
                  {meta.label}
                </span>
              </div>
            </motion.li>
          );
        })}
      </ul>
    </div>
  );
}
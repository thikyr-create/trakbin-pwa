"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, Building2, Receipt, CreditCard, Landmark } from "lucide-react";
import { Sora, JetBrains_Mono } from "next/font/google";
import { formatNaira } from "@/lib/utils/money";
import {
  paymentStatusMeta,
  ledgerStatusMeta,
} from "@/lib/core/finance/FinanceStatus";
import type { Transaction } from "@/lib/features/finance/services/financeService";

const display = Sora({ subsets: ["latin"], display: "swap", variable: "--font-display" });
const mono = JetBrains_Mono({ subsets: ["latin"], display: "swap", variable: "--font-mono" });

const TYPE_LABEL: Record<Transaction["type"], string> = {
  receipt: "Receipt",
  payment: "Payment attempt",
  settlement: "Settlement",
};

const TYPE_ICON: Record<Transaction["type"], any> = {
  receipt: Receipt,
  payment: CreditCard,
  settlement: Landmark,
};

interface TransactionDetailsDrawerProps {
  open: boolean;
  transaction: Transaction | null;
  onClose: () => void;
  onViewBuilding?: (customId: string) => void;
}

function formatDateTime(value: string): string {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function TransactionDetailsDrawer({
  open,
  transaction,
  onClose,
  onViewBuilding,
}: TransactionDetailsDrawerProps) {
  const meta = transaction
    ? transaction.type === "settlement"
      ? ledgerStatusMeta(transaction.status)
      : paymentStatusMeta(transaction.status)
    : null;

  const Icon = transaction ? TYPE_ICON[transaction.type] : Receipt;

  return (
    <AnimatePresence>
      {open && transaction && meta && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[900] bg-black/40 backdrop-blur-sm"
          />

          <motion.aside
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed right-0 top-0 z-[910] flex h-full w-full max-w-md flex-col bg-white shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-start justify-between border-b border-gray-100 px-6 py-5">
              <div className="flex items-center gap-4">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100">
                  <Icon size={20} />
                </span>
                <div>
                  <p className={`${mono.className} text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-600`}>
                    {TYPE_LABEL[transaction.type]}
                  </p>
                  <p className={`${display.className} text-2xl font-black tabular-nums text-gray-900`}>
                    {formatNaira(transaction.amount)}
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="rounded-lg p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
              >
                <X size={20} />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 space-y-4 overflow-y-auto px-6 py-6">
              <div className="flex items-center justify-between rounded-2xl border border-gray-100 bg-gray-50/60 px-5 py-4">
                <span className={`${mono.className} text-[10px] font-bold uppercase tracking-[0.18em] text-gray-500`}>
                  Status
                </span>
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ring-1 ${meta.classes} ${mono.className}`}
                >
                  <span className={`h-1.5 w-1.5 rounded-full ${meta.dot}`} />
                  {meta.label}
                </span>
              </div>

              <div className="rounded-2xl border border-gray-100 p-5">
                <p className={`${mono.className} mb-4 text-[10px] font-bold uppercase tracking-[0.18em] text-gray-500`}>
                  Record
                </p>
                <dl className="space-y-3">
                  {[
                    ["Reference", transaction.reference || "—"],
                    ["Building", transaction.building_id || "—"],
                    ["Address", transaction.building_address || "—"],
                    ["Provider", transaction.provider || "—"],
                    ["Method", transaction.method || "—"],
                    ["Date", formatDateTime(transaction.created_at)],
                  ].map(([label, value]) => (
                    <div key={label} className="flex items-start justify-between gap-4">
                      <dt className={`${mono.className} text-[10px] font-bold uppercase tracking-wider text-gray-400`}>
                        {label}
                      </dt>
                      <dd className="max-w-[60%] truncate text-right text-xs font-bold text-gray-800">
                        {value}
                      </dd>
                    </div>
                  ))}
                </dl>
              </div>

              {transaction.building_id && onViewBuilding && (
                <motion.button
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    onViewBuilding(transaction.building_id as string);
                    onClose();
                  }}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3 text-sm font-bold text-white shadow-lg shadow-emerald-200 transition hover:bg-emerald-700"
                >
                  <Building2 size={15} />
                  View building
                </motion.button>
              )}
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
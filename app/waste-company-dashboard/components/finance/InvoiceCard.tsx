"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { RotateCcw, CircleX, Receipt, Loader2 } from "lucide-react";
import { JetBrains_Mono } from "next/font/google";
import { invoiceStatusMeta } from "@/lib/core/finance/BillingStatus";
import {
  deriveInvoiceNumber,
  cycleOfDueDate,
  periodLabel,
} from "@/lib/features/finance/utils/billingHelpers";
import {
  regenerateInvoice,
  cancelInvoice,
  InvoiceEngineError,
} from "@/lib/core/finance/InvoiceEngine";
import { formatNaira } from "@/lib/utils/money";
import type { InvoiceRow } from "@/lib/features/finance/services/billingService";

const mono = JetBrains_Mono({ subsets: ["latin"], display: "swap", variable: "--font-mono" });
const EASE = [0.22, 1, 0.36, 1] as [number, number, number, number];

interface InvoiceCardProps {
  invoice: InvoiceRow;
  onDone: () => void;
  onViewReceipt?: (invoice: InvoiceRow) => void;
  index?: number;
}

export default function InvoiceCard({
  invoice,
  onDone,
  onViewReceipt,
  index = 0,
}: InvoiceCardProps) {
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const meta = invoiceStatusMeta(invoice.status);
  const invoiceNumber = deriveInvoiceNumber(invoice.id, invoice.due_date);
  const period = periodLabel(cycleOfDueDate(invoice.due_date));
  const isPaid = invoice.status === "paid";
  const isCancelled = invoice.status === "cancelled";

  const run = async (action: "regenerate" | "cancel") => {
    setError(null);
    setBusy(action);
    try {
      if (action === "regenerate") await regenerateInvoice(invoice.id);
      else await cancelInvoice(invoice.id);
      onDone();
    } catch (e) {
      setError(e instanceof InvoiceEngineError ? e.message : "Action failed.");
    } finally {
      setBusy(null);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: Math.min(index, 10) * 0.04, ease: EASE }}
      className="rounded-xl border border-gray-100 bg-white px-4 py-3.5"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <p className={`${mono.className} text-xs font-bold uppercase tracking-wider text-gray-900`}>
            {invoiceNumber}
          </p>
          <p className="mt-0.5 truncate text-[11px] font-semibold text-gray-500">
            {invoice.building_id}
            {invoice.building_address ? ` · ${invoice.building_address}` : ""}
          </p>
        </div>

        <div className="hidden text-center sm:block">
          <p className="text-xs font-bold text-gray-700">{period}</p>
          <p className={`${mono.className} text-[10px] font-semibold uppercase tracking-wider text-gray-400`}>
            due {new Date(invoice.due_date).toLocaleDateString("en-NG", { day: "numeric", month: "short" })}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <p className="text-sm font-black tabular-nums text-gray-900">
            {formatNaira(invoice.amount)}
          </p>
          <span
            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ring-1 ${meta.classes} ${mono.className}`}
          >
            <span className={`h-1.5 w-1.5 rounded-full ${meta.dot} ${meta.pulse ? "animate-pulse" : ""}`} />
            {meta.label}
          </span>

          <div className="flex items-center gap-1">
            {isPaid && onViewReceipt && (
              <button
                onClick={() => onViewReceipt(invoice)}
                title="View receipt"
                className="rounded-lg p-1.5 text-emerald-500 transition hover:bg-emerald-50"
              >
                <Receipt size={15} />
              </button>
            )}
            {!isPaid && !isCancelled && (
              <>
                <button
                  onClick={() => run("regenerate")}
                  disabled={busy !== null}
                  title="Regenerate invoice"
                  className="rounded-lg p-1.5 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700 disabled:opacity-50"
                >
                  {busy === "regenerate" ? (
                    <Loader2 size={15} className="animate-spin" />
                  ) : (
                    <RotateCcw size={15} />
                  )}
                </button>
                <button
                  onClick={() => run("cancel")}
                  disabled={busy !== null}
                  title="Cancel invoice"
                  className="rounded-lg p-1.5 text-gray-400 transition hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                >
                  {busy === "cancel" ? (
                    <Loader2 size={15} className="animate-spin" />
                  ) : (
                    <CircleX size={15} />
                  )}
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {error && (
        <p className="mt-2 text-[11px] font-semibold text-red-600">{error}</p>
      )}
    </motion.div>
  );
}
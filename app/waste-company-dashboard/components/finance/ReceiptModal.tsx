"use client";
import { supabaseBrowser } from '@/lib/supabaseBrowser';

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Receipt, Loader2 } from "lucide-react";
import { Sora, JetBrains_Mono } from "next/font/google";
import { formatNaira } from "@/lib/utils/money";
import { deriveInvoiceNumber } from "@/lib/features/finance/utils/billingHelpers";
import type { InvoiceRow } from "@/lib/features/finance/services/billingService";

const display = Sora({ subsets: ["latin"], display: "swap", variable: "--font-display" });
const mono = JetBrains_Mono({ subsets: ["latin"], display: "swap", variable: "--font-mono" });

const supabase = supabaseBrowser;

interface ReceiptModalProps {
  open: boolean;
  invoice: InvoiceRow | null;
  onClose: () => void;
}

function formatDate(value?: string | null): string {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-NG", { day: "numeric", month: "long", year: "numeric" });
}

export default function ReceiptModal({ open, invoice, onClose }: ReceiptModalProps) {
  const [receipt, setReceipt] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || !invoice) {
      setReceipt(null);
      return;
    }

    let cancelled = false;

    const load = async () => {
      setLoading(true);

      const { data } = await supabase
        .from("receipts")
        .select("*")
        .eq("building_id", invoice.building_id)
        .eq("company_id", invoice.company_id)
        .order("issued_at", { ascending: false })
        .limit(12);

      if (cancelled) return;

      const due = new Date(invoice.due_date);
      const rows = data || [];

      // 1) match by billing period, 2) fallback by amount
      const byPeriod = rows.find((r: any) => {
        const issued = new Date(r.issued_at || r.created_at);
        return (
          issued.getFullYear() === due.getFullYear() &&
          issued.getMonth() === due.getMonth()
        );
      });
      const byAmount = rows.find(
        (r: any) => Number(r.gross) === Number(invoice.amount)
      );

      setReceipt(byPeriod || byAmount || null);
      setLoading(false);
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [open, invoice]);

  return (
    <AnimatePresence>
      {open && invoice && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[940] bg-black/40 backdrop-blur-sm"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 16 }}
            transition={{ type: "spring", damping: 28, stiffness: 320 }}
            className="fixed left-1/2 top-1/2 z-[950] w-full max-w-md -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-[24px] bg-white shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-gray-100 bg-emerald-950 px-6 py-5 text-white">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 ring-1 ring-white/15">
                  <Receipt size={18} />
                </span>
                <div>
                  <p className={`${mono.className} text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-200/70`}>
                    Payment receipt
                  </p>
                  <p className={`${display.className} text-lg font-black`}>
                    {formatNaira(invoice.amount)}
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="rounded-lg p-2 text-emerald-200/70 transition hover:bg-white/10 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            {/* Body */}
            <div className="space-y-4 px-6 py-6">
              <div className="rounded-2xl border border-gray-100 p-4">
                <p className={`${mono.className} mb-3 text-[10px] font-bold uppercase tracking-[0.18em] text-gray-400`}>
                  Invoice
                </p>
                <dl className="space-y-2">
                  {[
                    ["Number", deriveInvoiceNumber(invoice.id, invoice.due_date)],
                    ["Building", invoice.building_id],
                    ["Paid on", formatDate(invoice.paid_at)],
                    ["Amount", formatNaira(invoice.amount)],
                  ].map(([label, value]) => (
                    <div key={label} className="flex items-center justify-between gap-4">
                      <dt className={`${mono.className} text-[10px] font-bold uppercase tracking-wider text-gray-400`}>
                        {label}
                      </dt>
                      <dd className="text-xs font-bold text-gray-800">{value}</dd>
                    </div>
                  ))}
                </dl>
              </div>

              {loading ? (
                <div className="flex items-center justify-center gap-2 rounded-2xl border border-dashed border-gray-200 p-6 text-gray-400">
                  <Loader2 size={16} className="animate-spin" />
                  <span className="text-xs font-semibold">Locating receipt…</span>
                </div>
              ) : receipt ? (
                <div className="rounded-2xl border border-emerald-100 bg-emerald-50/50 p-4">
                  <p className={`${mono.className} mb-3 text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-600`}>
                    Receipt record
                  </p>
                  <dl className="space-y-2">
                    {[
                      ["Receipt №", receipt.receipt_number || "—"],
                      ["Issued", formatDate(receipt.issued_at || receipt.created_at)],
                      ["Gross", formatNaira(receipt.gross)],
                      ["Platform fee", formatNaira(receipt.commission)],
                      ["Net", formatNaira(receipt.net)],
                      ["Provider", receipt.provider_name || "—"],
                      ["Payer", receipt.payer_email || "—"],
                    ].map(([label, value]) => (
                      <div key={label} className="flex items-center justify-between gap-4">
                        <dt className={`${mono.className} text-[10px] font-bold uppercase tracking-wider text-gray-400`}>
                          {label}
                        </dt>
                        <dd className="max-w-[60%] truncate text-xs font-bold text-gray-800">
                          {value}
                        </dd>
                      </div>
                    ))}
                  </dl>
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-gray-200 p-6 text-center">
                  <p className="text-xs font-bold text-gray-500">No receipt record found</p>
                  <p className="mt-1 text-[11px] font-medium text-gray-400">
                    Payment is confirmed on the invoice, but no receipt row exists for this period.
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

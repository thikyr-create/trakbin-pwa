"use client";

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Zap, FileText, Plus, Loader2, Inbox } from "lucide-react";
import { Sora, JetBrains_Mono } from "next/font/google";
import { useInvoices } from "@/lib/features/finance/hooks/useInvoices";
import { generateBulk, generateForBuilding, InvoiceEngineError } from "@/lib/core/finance/InvoiceEngine";
import { formatNaira } from "@/lib/utils/money";
import InvoiceCard from "./InvoiceCard";
import ReceiptModal from "./ReceiptModal";
import type { InvoiceRow } from "@/lib/features/finance/services/billingService";

const display = Sora({ subsets: ["latin"], display: "swap", variable: "--font-display" });
const mono = JetBrains_Mono({ subsets: ["latin"], display: "swap", variable: "--font-mono" });
const EASE = [0.22, 1, 0.36, 1] as [number, number, number, number];

const STATUS_FILTERS = [
  { id: "all", label: "All" },
  { id: "open", label: "Open" },
  { id: "overdue", label: "Overdue" },
  { id: "paid", label: "Paid" },
  { id: "cancelled", label: "Cancelled" },
];

export default function InvoicesSection() {
  const { invoices, stats, loading, error, refetch } = useInvoices();
  const [statusFilter, setStatusFilter] = useState("all");
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState<{ generated: number; skipped: Record<string, number> } | null>(null);
  const [showSingle, setShowSingle] = useState(false);
  const [singleId, setSingleId] = useState("");
  const [receiptInvoice, setReceiptInvoice] = useState<InvoiceRow | null>(null);

  const filtered = useMemo(() => {
    if (statusFilter === "all") return invoices;
    if (statusFilter === "open")
      return invoices.filter((i) => ["issued", "viewed", "draft"].includes(i.status));
    return invoices.filter((i) => i.status === statusFilter);
  }, [invoices, statusFilter]);

  const runBulk = async () => {
    setGenerating(true);
    setResult(null);
    try {
      const res = await generateBulk();
      setResult({ generated: res.generated || 0, skipped: res.skipped || {} });
      await refetch();
    } catch (e) {
      setResult({ generated: 0, skipped: { error: 1 } });
    } finally {
      setGenerating(false);
    }
  };

  const runSingle = async () => {
    if (!singleId.trim()) return;
    setGenerating(true);
    setResult(null);
    try {
      const res = await generateForBuilding(singleId.trim());
      setResult({ generated: res.generated || 0, skipped: res.skipped || {} });
      setSingleId("");
      setShowSingle(false);
      await refetch();
    } catch (e) {
      setResult({ generated: 0, skipped: { [e instanceof InvoiceEngineError ? e.message : "error"]: 1 } });
    } finally {
      setGenerating(false);
    }
  };

  const skippedTotal = result ? Object.values(result.skipped).reduce((a, b) => a + b, 0) : 0;

  const statTiles = stats
    ? [
        { label: "Generated today", value: String(stats.issuedToday), accent: "text-emerald-700" },
        { label: "Open", value: String(stats.open), accent: "text-sky-700" },
        { label: "Overdue", value: String(stats.overdue), accent: "text-red-700" },
        { label: "Paid", value: String(stats.paid), accent: "text-emerald-700" },
        { label: "Outstanding", value: formatNaira(stats.outstandingAmount), accent: "text-amber-700" },
      ]
    : [];

  return (
    <div className="overflow-hidden rounded-[24px] border border-gray-200/80 bg-white shadow-sm">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 px-6 py-5">
        <h2 className={`${display.className} flex items-center gap-2.5 text-lg font-extrabold tracking-tight text-gray-900`}>
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100">
            <FileText className="h-4 w-4" />
          </span>
          Invoices
        </h2>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowSingle((v) => !v)}
            className="flex items-center gap-1.5 rounded-xl bg-gray-50 px-3 py-2 text-xs font-bold text-gray-700 ring-1 ring-gray-200 transition hover:bg-gray-100"
          >
            <Plus size={14} /> Single
          </button>
          <button
            onClick={runBulk}
            disabled={generating}
            className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-md shadow-emerald-200 transition hover:bg-emerald-700 disabled:opacity-50"
          >
            {generating ? <Loader2 size={14} className="animate-spin" /> : <Zap size={14} />}
            Run billing
          </button>
        </div>
      </div>

      <div className="space-y-4 px-6 py-5">
        {/* Single generation input */}
        <AnimatePresence>
          {showSingle && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.25, ease: EASE }}
              className="overflow-hidden"
            >
              <div className="flex gap-2 rounded-xl border border-gray-100 bg-gray-50/60 p-3">
                <input
                  type="text"
                  value={singleId}
                  onChange={(e) => setSingleId(e.target.value)}
                  placeholder="Building ID e.g. YHC-001"
                  className="flex-1 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-800 outline-none focus:border-emerald-400"
                />
                <button
                  onClick={runSingle}
                  disabled={generating || !singleId.trim()}
                  className="rounded-lg bg-emerald-600 px-4 py-2 text-xs font-bold text-white transition hover:bg-emerald-700 disabled:opacity-50"
                >
                  Generate
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Result banner */}
        {result && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-xl border border-emerald-100 bg-emerald-50/60 px-4 py-3 text-xs font-semibold text-emerald-800"
          >
            Generated <strong>{result.generated}</strong> invoice{result.generated === 1 ? "" : "s"}
            {skippedTotal > 0 && (
              <span className="text-gray-500">
                {" "}· skipped {skippedTotal} (
                {Object.entries(result.skipped).map(([k, v]) => `${k}: ${v}`).join(", ")})
              </span>
            )}
          </motion.div>
        )}

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-semibold text-red-700">
            {error}
          </div>
        )}

        {/* Stats strip */}
        {stats && !loading && (
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
            {statTiles.map((t) => (
              <div key={t.label} className="rounded-xl bg-gray-50 px-3 py-2.5">
                <p className={`${display.className} text-base font-extrabold tabular-nums ${t.accent}`}>
                  {t.value}
                </p>
                <p className={`${mono.className} mt-0.5 text-[9px] font-bold uppercase tracking-wider text-gray-400`}>
                  {t.label}
                </p>
              </div>
            ))}
          </div>
        )}

        {/* Status filter */}
        <div className="flex flex-wrap gap-1.5">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.id}
              onClick={() => setStatusFilter(f.id)}
              className={`rounded-lg px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider transition ${
                statusFilter === f.id
                  ? "bg-emerald-600 text-white"
                  : "bg-gray-50 text-gray-500 ring-1 ring-gray-200 hover:ring-emerald-300"
              } ${mono.className}`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Invoice list */}
        {loading ? (
          <div className="space-y-2">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-16 animate-pulse rounded-xl bg-gray-200/60" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-gray-50/50 p-10 text-center">
            <Inbox className="mb-2 h-7 w-7 text-gray-300" />
            <p className="text-sm font-bold text-gray-500">No invoices here</p>
            <p className="mt-1 text-xs text-gray-400">
              Run billing to generate invoices for eligible buildings.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.slice(0, 50).map((inv, i) => (
              <InvoiceCard
                key={inv.id}
                invoice={inv}
                index={i}
                onDone={refetch}
                onViewReceipt={(row) => setReceiptInvoice(row)}
              />
            ))}
          </div>
        )}
      </div>

      <ReceiptModal
        open={!!receiptInvoice}
        invoice={receiptInvoice}
        onClose={() => setReceiptInvoice(null)}
      />
    </div>
  );
}
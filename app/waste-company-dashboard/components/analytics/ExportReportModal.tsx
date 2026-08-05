"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, FileSpreadsheet, FileText, Users, Check } from "lucide-react";
import { Sora, JetBrains_Mono } from "next/font/google";
import {
  buildKpiReport,
  buildInvoiceReport,
  buildDriverReport,
  downloadCsv,
} from "@/lib/core/analytics/ReportEngine";
import type { AnalyticsKpis } from "@/lib/core/analytics/metricsEngine";

const display = Sora({ subsets: ["latin"], display: "swap", variable: "--font-display" });
const mono = JetBrains_Mono({ subsets: ["latin"], display: "swap", variable: "--font-mono" });

interface ExportReportModalProps {
  open: boolean;
  onClose: () => void;
  kpis: AnalyticsKpis | null;
  preset: string;
  invoices: any[];
  drivers: any[];
}

export default function ExportReportModal({
  open,
  onClose,
  kpis,
  preset,
  invoices,
  drivers,
}: ExportReportModalProps) {
  const [downloaded, setDownloaded] = useState<string | null>(null);

  const run = (key: string, fn: () => void) => {
    fn();
    setDownloaded(key);
    setTimeout(() => {
      setDownloaded(null);
      onClose();
    }, 900);
  };

  const reports = [
    {
      key: "kpis",
      Icon: FileSpreadsheet,
      title: "KPI summary",
      desc: "All headline metrics for the selected period",
      disabled: !kpis,
      action: () => kpis && downloadCsv(buildKpiReport(kpis, preset)),
    },
    {
      key: "invoices",
      Icon: FileText,
      title: "Invoice ledger",
      desc: `${invoices.length} invoice${invoices.length === 1 ? "" : "s"} · amounts, statuses, due dates`,
      disabled: invoices.length === 0,
      action: () => downloadCsv(buildInvoiceReport(invoices)),
    },
    {
      key: "drivers",
      Icon: Users,
      title: "Driver roster",
      desc: `${drivers.length} driver${drivers.length === 1 ? "" : "s"} · IDs, names, statuses`,
      disabled: drivers.length === 0,
      action: () => downloadCsv(buildDriverReport(drivers)),
    },
  ];

  return (
    <AnimatePresence>
      {open && (
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
            <div className="flex items-center justify-between border-b border-gray-100 px-6 py-5">
              <div>
                <h2 className={`${display.className} text-lg font-extrabold tracking-tight text-gray-900`}>
                  Export reports
                </h2>
                <p className={`${mono.className} mt-0.5 text-[10px] font-bold uppercase tracking-[0.18em] text-gray-400`}>
                  csv · real data only
                </p>
              </div>
              <button
                onClick={onClose}
                className="rounded-lg p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-2.5 px-6 py-5">
              {reports.map((r) => {
                const Icon = r.Icon;
                const done = downloaded === r.key;
                return (
                  <button
                    key={r.key}
                    onClick={() => run(r.key, r.action)}
                    disabled={r.disabled || done}
                    className={`flex w-full items-center gap-3 rounded-xl border p-4 text-left transition ${
                      done
                        ? "border-emerald-200 bg-emerald-50"
                        : r.disabled
                        ? "cursor-not-allowed border-gray-100 bg-gray-50/50 opacity-60"
                        : "border-gray-100 hover:border-emerald-200 hover:bg-emerald-50/40"
                    }`}
                  >
                    <span
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ring-1 ${
                        done
                          ? "bg-emerald-100 text-emerald-600 ring-emerald-200"
                          : "bg-gray-50 text-gray-600 ring-gray-100"
                      }`}
                    >
                      {done ? <Check size={17} /> : <Icon size={17} />}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-bold text-gray-900">
                        {done ? "Downloaded" : r.title}
                      </span>
                      <span className="block truncate text-[11px] font-medium text-gray-400">
                        {r.desc}
                      </span>
                    </span>
                  </button>
                );
              })}

              <p className="pt-1 text-center text-[10px] font-semibold text-gray-300">
                PDF / Excel export arrives when those libraries are approved
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
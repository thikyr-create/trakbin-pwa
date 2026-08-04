"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Receipt, Landmark } from "lucide-react";
import { Sora, JetBrains_Mono } from "next/font/google";
import { useBuildingDetail } from "@/lib/features/buildings/hooks/useBuildings";
import {
  formatNaira,
  unitsLabel,
  buildBuildingTimeline,
} from "@/lib/features/buildings/utils/buildingHelpers";
import { paymentTxnStatusMeta } from "@/lib/core/building/BuildingStatus";
import BuildingStatusBadge from "./BuildingStatusBadge";
import CollectionHistory from "./CollectionHistory";
import AssignedDriverCard from "./AssignedDriverCard";
import ServiceProviderCard from "./ServiceProviderCard";
import BuildingMapPreview from "./BuildingMapPreview";
import QuickActions from "./QuickActions";
import BuildingTimeline from "./BuildingTimeline";

const display = Sora({ subsets: ["latin"], display: "swap", variable: "--font-display" });
const mono = JetBrains_Mono({ subsets: ["latin"], display: "swap", variable: "--font-mono" });
const EASE = [0.22, 1, 0.36, 1] as [number, number, number, number];

type Tab = "overview" | "history" | "payments" | "reports" | "timeline";

const TABS: Array<{ id: Tab; label: string }> = [
  { id: "overview", label: "Overview" },
  { id: "history", label: "History" },
  { id: "payments", label: "Payments" },
  { id: "reports", label: "Reports" },
  { id: "timeline", label: "Timeline" },
];

interface BuildingDetailsDrawerProps {
  open: boolean;
  customId: string | null;
  onClose: () => void;
  onSuccess: () => void; // refresh the parent list too
}

function formatDateTime(value?: string | null): string {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" });
}

export default function BuildingDetailsDrawer({
  open,
  customId,
  onClose,
  onSuccess,
}: BuildingDetailsDrawerProps) {
  const { detail, loading, refetch } = useBuildingDetail(open ? customId : null);
  const [tab, setTab] = useState<Tab>("overview");

  useEffect(() => {
    setTab("overview");
  }, [customId]);

  const handleSuccess = () => {
    refetch();
    onSuccess();
  };

  const timelineEntries = detail
    ? buildBuildingTimeline({
        building: detail,
        serviceAssignment: detail.service_assignment,
        collections: detail.collections,
        receipts: detail.receipts,
        issues: detail.issues,
      })
    : [];

  return (
    <AnimatePresence>
      {open && customId && (
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
            className="fixed right-0 top-0 z-[910] flex h-full w-full max-w-lg flex-col bg-[#f6f7f6] shadow-2xl"
          >
            {/* Header */}
            <div className="border-b border-gray-200 bg-white px-6 py-5">
              <div className="flex items-start justify-between">
                <div className="min-w-0">
                  <p className={`${mono.className} text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-600`}>
                    {detail?.custom_id || customId}
                  </p>
                  <h3 className={`${display.className} mt-1 truncate text-xl font-black tracking-tight text-gray-900`}>
                    {detail?.address || "Loading building…"}
                  </h3>
                  <p className="mt-0.5 text-xs font-semibold text-gray-500">
                    {detail?.estate || detail?.zone_name || ""}
                  </p>
                </div>
                <button
                  onClick={onClose}
                  className="rounded-lg p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
                >
                  <X size={20} />
                </button>
              </div>

              {detail && (
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <BuildingStatusBadge kind="status" value={detail.status} size="sm" />
                  <BuildingStatusBadge kind="payment" value={detail.payment_status} size="sm" />
                  <span className={`${mono.className} rounded-full bg-gray-100 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-gray-500 ring-1 ring-gray-200`}>
                    {unitsLabel(detail)}
                  </span>
                  <span className={`${mono.className} rounded-full bg-gray-100 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-gray-500 ring-1 ring-gray-200`}>
                    Wallet {formatNaira(detail.wallet_balance)}
                  </span>
                </div>
              )}
            </div>

            {/* Tabs */}
            <div className="flex gap-1 border-b border-gray-200 bg-white px-4">
              {TABS.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className={`relative px-3 py-3 text-[11px] font-bold uppercase tracking-wider transition ${
                    tab === t.id ? "text-emerald-600" : "text-gray-400 hover:text-gray-600"
                  } ${mono.className}`}
                >
                  {t.label}
                  {tab === t.id && (
                    <motion.span
                      layoutId="building-tab"
                      className="absolute inset-x-2 bottom-0 h-0.5 rounded-full bg-emerald-500"
                    />
                  )}
                </button>
              ))}
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-5">
              {loading && !detail ? (
                <div className="space-y-4">
                  {[0, 1, 2].map((i) => (
                    <div key={i} className="h-28 animate-pulse rounded-2xl bg-gray-200/60" />
                  ))}
                </div>
              ) : detail ? (
                <AnimatePresence mode="wait">
                  <motion.div
                    key={tab}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.2, ease: EASE }}
                  >
                    {tab === "overview" && (
                      <div className="space-y-4">
                        <ServiceProviderCard
                          serviceAssignment={detail.service_assignment}
                          zoneName={detail.zone_name}
                        />
                        <AssignedDriverCard
                          driverName={detail.assigned_driver_name}
                          zoneName={detail.zone_name}
                        />
                        <BuildingMapPreview
                          latitude={detail.latitude}
                          longitude={detail.longitude}
                          zone={detail.zone_geo}
                          routeGeometry={detail.route_geometry}
                          issues={detail.issues}
                        />
                        <QuickActions
                          customId={detail.custom_id}
                          pickupDays={detail.pickup_days}
                          timeWindow={detail.service_assignment?.time_window}
                          autopayEnabled={detail.autopay_enabled}
                          onSuccess={handleSuccess}
                        />
                      </div>
                    )}

                    {tab === "history" && <CollectionHistory collections={detail.collections} />}

                    {tab === "payments" && (
                      <div className="space-y-5">
                        <div>
                          <p className={`${mono.className} mb-2 text-[10px] font-bold uppercase tracking-[0.18em] text-gray-400`}>
                            Receipts ({detail.receipts.length})
                          </p>
                          {detail.receipts.length === 0 ? (
                            <div className="flex flex-col items-center rounded-2xl border border-dashed border-gray-200 bg-white/60 p-6 text-center">
                              <Receipt className="mb-2 h-6 w-6 text-gray-300" />
                              <p className="text-xs font-bold text-gray-500">No receipts issued yet</p>
                            </div>
                          ) : (
                            <div className="space-y-2">
                              {detail.receipts.map((r: any, i: number) => (
                                <div key={r.id ?? i} className="flex items-center justify-between rounded-xl border border-gray-100 bg-white px-4 py-3">
                                  <div>
                                    <p className="text-xs font-bold text-gray-900">{r.receipt_number || "Receipt"}</p>
                                    <p className="text-[10px] font-medium text-gray-400">{formatDateTime(r.issued_at)}</p>
                                  </div>
                                  <p className={`${display.className} text-sm font-black text-emerald-700`}>
                                    {formatNaira(r.gross)}
                                  </p>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        <div>
                          <p className={`${mono.className} mb-2 text-[10px] font-bold uppercase tracking-[0.18em] text-gray-400`}>
                            Payment attempts ({detail.payments.length})
                          </p>
                          {detail.payments.length === 0 ? (
                            <div className="flex flex-col items-center rounded-2xl border border-dashed border-gray-200 bg-white/60 p-6 text-center">
                              <Landmark className="mb-2 h-6 w-6 text-gray-300" />
                              <p className="text-xs font-bold text-gray-500">No payment attempts</p>
                            </div>
                          ) : (
                            <div className="space-y-2">
                              {detail.payments.map((p: any, i: number) => {
                                const meta = paymentTxnStatusMeta(p.status);
                                return (
                                  <div key={p.id ?? i} className="flex items-center justify-between rounded-xl border border-gray-100 bg-white px-4 py-3">
                                    <div>
                                      <p className="text-xs font-bold text-gray-900">
                                        {p.provider || "Provider"} · {p.method || p.channel || "—"}
                                      </p>
                                      <p className="text-[10px] font-medium text-gray-400">{formatDateTime(p.created_at)}</p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <span className="text-xs font-bold text-gray-900">{formatNaira(p.amount)}</span>
                                      <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ring-1 ${meta.classes} ${mono.className}`}>
                                        <span className={`h-1.5 w-1.5 rounded-full ${meta.dot}`} />
                                        {meta.label}
                                      </span>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {tab === "reports" && (
                      <div className="space-y-2">
                        {detail.issues.length === 0 ? (
                          <div className="flex flex-col items-center rounded-2xl border border-dashed border-gray-200 bg-white/60 p-8 text-center">
                            <p className="text-sm font-bold text-gray-500">No issues reported</p>
                          </div>
                        ) : (
                          detail.issues.map((iss: any, i: number) => (
                            <div key={iss.id ?? i} className="rounded-xl border border-gray-100 bg-white px-4 py-3">
                              <div className="flex items-center justify-between">
                                <p className="text-xs font-bold text-gray-900">{iss.issue_type || "Issue"}</p>
                                <BuildingStatusBadge kind="status" value={iss.status} size="sm" />
                              </div>
                              <p className="mt-0.5 text-[10px] font-medium text-gray-400">
                                {formatDateTime(iss.created_at)} · severity {iss.severity || "—"} · priority {iss.priority || "—"}
                              </p>
                              {iss.description && (
                                <p className="mt-1 text-[11px] font-medium text-gray-600">{iss.description}</p>
                              )}
                            </div>
                          ))
                        )}
                      </div>
                    )}

                    {tab === "timeline" && <BuildingTimeline entries={timelineEntries} />}
                  </motion.div>
                </AnimatePresence>
              ) : null}
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
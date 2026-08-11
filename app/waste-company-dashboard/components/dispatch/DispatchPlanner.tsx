"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { CalendarDays, Loader2, CircleCheck, TriangleAlert, Truck, Users, Route } from "lucide-react";
import { Sora, JetBrains_Mono } from "next/font/google";
import { previewDispatch, executeDispatch, type DispatchPreview } from "@/lib/features/dispatch/services/dispatchService";
import { useCompanySession } from "@/lib/store/useCompanySession";

const display = Sora({ subsets: ["latin"], display: "swap", variable: "--font-display" });
const mono = JetBrains_Mono({ subsets: ["latin"], display: "swap", variable: "--font-mono" });
const EASE = [0.22, 1, 0.36, 1] as [number, number, number, number];

export default function DispatchPlanner() {
  const { tenant, addNotification } = useCompanySession();
  const companyId = tenant.companyId ? Number(tenant.companyId) : null;

  const [targetDate, setTargetDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1); // Default to tomorrow
    return d.toISOString().slice(0, 10);
  });

  const [preview, setPreview] = useState<DispatchPreview | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [executing, setExecuting] = useState(false);

  const loadPreview = async () => {
    if (!companyId) return;
    setLoadingPreview(true);
    try {
      const result = await previewDispatch(companyId, new Date(targetDate));
      setPreview(result);
    } catch (err: any) {
      addNotification(err.message || "Failed to load preview.", "error");
    } finally {
      setLoadingPreview(false);
    }
  };

  const handleExecute = async () => {
    if (!companyId || !preview?.canExecute) return;
    setExecuting(true);
    try {
      const result = await executeDispatch(companyId, new Date(targetDate));
      addNotification(
        `Dispatch materialized: ${result.routesCreated} routes, ${result.stopsMaterialized} stops.`,
        "success"
      );
      setPreview(null); // Clear preview after execution
    } catch (err: any) {
      addNotification(err.message || "Execution failed.", "error");
    } finally {
      setExecuting(false);
    }
  };

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: EASE }}
      className="overflow-hidden rounded-[24px] border border-gray-200/80 bg-white shadow-sm"
    >
      <div className="flex items-center justify-between border-b border-gray-100 px-6 py-5">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-50 text-sky-600 ring-1 ring-sky-100">
            <CalendarDays size={18} />
          </span>
          <div>
            <h2 className={`${display.className} text-lg font-extrabold tracking-tight text-gray-900`}>
              Dispatch Planner
            </h2>
            <p className={`${mono.className} text-[10px] font-bold uppercase tracking-[0.18em] text-gray-400`}>
              schedule → routes · materialization engine
            </p>
          </div>
        </div>
      </div>

      <div className="p-6">
        <div className="flex flex-wrap items-end gap-4">
          <div>
            <label className={`${mono.className} mb-1.5 block text-[10px] font-bold uppercase tracking-[0.16em] text-gray-500`}>
              Target Date
            </label>
            <input
              type="date"
              value={targetDate}
              onChange={(e) => setTargetDate(e.target.value)}
              className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm font-semibold text-gray-900 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
            />
          </div>
          <button
            onClick={loadPreview}
            disabled={loadingPreview || !companyId}
            className="flex items-center gap-2 rounded-xl bg-gray-900 px-5 py-2.5 text-xs font-bold text-white transition hover:bg-gray-700 disabled:opacity-50"
          >
            {loadingPreview ? <Loader2 size={14} className="animate-spin" /> : <Route size={14} />}
            Preview Plan
          </button>
        </div>

        {preview && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6 space-y-4"
          >
            <div className="rounded-xl border border-gray-100 bg-gray-50/60 p-4">
              <p className={`${mono.className} mb-3 text-[10px] font-bold uppercase tracking-[0.18em] text-gray-500`}>
                {preview.dayName}, {preview.targetDate} · {preview.totalBuildings} buildings scheduled
              </p>
              <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                <div className="rounded-lg bg-white p-3 ring-1 ring-gray-200">
                  <p className="text-[10px] font-semibold text-gray-400">Routes Needed</p>
                  <p className={`${display.className} text-xl font-extrabold text-gray-900`}>
                    {preview.zones.reduce((s, z) => s + z.requiredRoutes, 0)}
                  </p>
                </div>
                <div className="rounded-lg bg-white p-3 ring-1 ring-gray-200">
                  <p className="text-[10px] font-semibold text-gray-400">Zones</p>
                  <p className={`${display.className} text-xl font-extrabold text-gray-900`}>{preview.zones.length}</p>
                </div>
                <div className="rounded-lg bg-white p-3 ring-1 ring-emerald-200">
                  <p className="text-[10px] font-semibold text-emerald-600">Drivers Avail</p>
                  <p className={`${display.className} text-xl font-extrabold text-emerald-700`}>{preview.availableDrivers}</p>
                </div>
                <div className="rounded-lg bg-white p-3 ring-1 ring-sky-200">
                  <p className="text-[10px] font-semibold text-sky-600">Trucks Avail</p>
                  <p className={`${display.className} text-xl font-extrabold text-sky-700`}>{preview.availableTrucks}</p>
                </div>
              </div>
            </div>

            {preview.zones.length > 0 && (
              <div className="space-y-2">
                {preview.zones.map((z) => (
                  <div key={z.zone_name} className="flex items-center justify-between rounded-lg border border-gray-100 bg-white px-4 py-2.5">
                    <p className="text-sm font-bold text-gray-800">{z.zone_name}</p>
                    <p className={`${mono.className} text-[11px] font-bold text-gray-500`}>
                      {z.buildingCount} stops · {z.requiredRoutes} route{z.requiredRoutes > 1 ? 's' : ''}
                    </p>
                  </div>
                ))}
              </div>
            )}

            {preview.blockReason && (
              <div className="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs font-semibold text-amber-800">
                <TriangleAlert size={14} />
                {preview.blockReason}
              </div>
            )}

            <button
              onClick={handleExecute}
              disabled={!preview.canExecute || executing}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3.5 text-sm font-extrabold text-white shadow-lg shadow-emerald-200 transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-gray-300 disabled:shadow-none"
            >
              {executing ? <Loader2 size={16} className="animate-spin" /> : <CircleCheck size={16} />}
              {executing ? "Materializing Routes…" : "Materialize Dispatch"}
            </button>
          </motion.div>
        )}
      </div>
    </motion.section>
  );
}
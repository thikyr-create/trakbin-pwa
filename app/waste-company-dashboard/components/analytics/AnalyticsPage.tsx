// app/waste-company-dashboard/components/analytics/AnalyticsPage.tsx
"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Download } from "lucide-react";
import { Plus_Jakarta_Sans } from "next/font/google";
import { useAnalytics } from "@/lib/features/analytics/hooks/useAnalytics";
import { useCompanySession } from "@/lib/store/useCompanySession";
import { useEntitlement } from "@/lib/features/subscription/hooks/useEntitlement";
import CapabilityLocked from "../entitlement/CapabilityLocked";
import AnalyticsFilters from "./AnalyticsFilters";
import KPIGrid from "./KPIGrid";
import RevenueTrendChart from "./RevenueTrendChart";
import CollectionsChart from "./CollectionsChart";
import PaymentStatusChart from "./PaymentStatusChart";
import FleetSnapshotChart from "./FleetSnapshotChart";
import BuildingGrowthChart from "./BuildingGrowthChart";
import DriverPerformanceTable from "./DriverPerformanceTable";
import InsightsSection from "./InsightsSection";
import ExportReportModal from "./ExportReportModal";

const body = Plus_Jakarta_Sans({ subsets: ["latin"], display: "swap", variable: "--font-body" });
const EASE = [0.22, 1, 0.36, 1] as [number, number, number, number];

export default function AnalyticsPage() {
  const { tenant } = useCompanySession();
  const { allowed, checking } = useEntitlement(tenant?.companyId, 'analytics');
  const { data, loading, error, preset, setPreset, kpis, revenueSeries, growthSeries, paymentDist, fleet, insights } = useAnalytics();
  const [showExport, setShowExport] = useState(false);

  if (checking) {
    return (
      <div className="py-16 text-center">
        <motion.div className="mx-auto h-8 w-8 rounded-full border-2 border-emerald-600 border-t-transparent" animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} />
        <p className="mt-3 text-sm text-gray-500">Checking entitlement…</p>
      </div>
    );
  }
  if (!allowed) return <CapabilityLocked title="Analytics" capability="analytics" />;

  const executionGap = (data?.plannedRuns ?? 0) === 0;

  return (
    <div className={`${body.className} space-y-5`}>
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease: EASE }} className="flex flex-wrap items-center justify-between gap-3">
        <AnalyticsFilters preset={preset} onChange={setPreset} />
        <button onClick={() => setShowExport(true)} disabled={!kpis} className="flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-xs font-bold text-gray-700 shadow-sm ring-1 ring-gray-200 transition hover:ring-emerald-300 disabled:opacity-50">
          <Download size={14} /> Export reports
        </button>
      </motion.div>

      {error && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-semibold text-red-700">{error}</div>}

      <KPIGrid kpis={kpis} loading={loading} executionGap={executionGap} />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, delay: 0.08, ease: EASE }} className="lg:col-span-3">
          {loading ? <div className="h-64 animate-pulse rounded-[24px] bg-gray-200/60" /> : <RevenueTrendChart series={revenueSeries} />}
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, delay: 0.12, ease: EASE }} className="lg:col-span-2">
          {loading ? <div className="h-64 animate-pulse rounded-[24px] bg-gray-200/60" /> : <CollectionsChart plannedRuns={data?.plannedRuns ?? 0} plannedStops={data?.plannedStops ?? 0} connectedRuns={data?.connectedRuns ?? 0} />}
        </motion.div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, delay: 0.16, ease: EASE }}>
          {loading ? <div className="h-56 animate-pulse rounded-[24px] bg-gray-200/60" /> : <PaymentStatusChart dist={paymentDist} />}
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, delay: 0.2, ease: EASE }}>
          {loading ? <div className="h-56 animate-pulse rounded-[24px] bg-gray-200/60" /> : <FleetSnapshotChart fleet={fleet} />}
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, delay: 0.24, ease: EASE }} className="md:col-span-2 xl:col-span-1">
          {loading ? <div className="h-56 animate-pulse rounded-[24px] bg-gray-200/60" /> : <BuildingGrowthChart series={growthSeries} />}
        </motion.div>
      </div>

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, delay: 0.28, ease: EASE }}>
        {loading ? <div className="h-64 animate-pulse rounded-[24px] bg-gray-200/60" /> : <DriverPerformanceTable drivers={data?.drivers ?? []} plannedRuns={data?.plannedRuns ?? 0} />}
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, delay: 0.32, ease: EASE }}>
        {loading ? <div className="h-40 animate-pulse rounded-[24px] bg-gray-200/60" /> : <InsightsSection insights={insights} />}
      </motion.div>

      <ExportReportModal open={showExport} onClose={() => setShowExport(false)} kpis={kpis} preset={preset} invoices={data?.invoices ?? []} drivers={data?.drivers ?? []} />
    </div>
  );
}
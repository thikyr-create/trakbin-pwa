// lib/features/analytics/hooks/useAnalytics.ts
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  fetchAnalyticsData,
  type AnalyticsData,
} from "../services/analyticsService";
import {
  computeKpis,
  computeRevenueSeries,
  computeBuildingGrowth,
  computePaymentDistribution,
  computeFleetSnapshot,
  computeInsights,
  type DateRange,
} from "@/lib/core/analytics/metricsEngine";

export type RangePreset = "today" | "week" | "month" | "year";

function rangeForPreset(preset: RangePreset): DateRange {
  const end = new Date();
  const start = new Date();

  switch (preset) {
    case "today":
      start.setHours(0, 0, 0, 0);
      break;
    case "week":
      start.setDate(start.getDate() - 7);
      break;
    case "month":
      start.setDate(start.getDate() - 30);
      break;
    case "year":
      start.setFullYear(start.getFullYear() - 1);
      break;
  }

  return { start, end };
}

function getCompanyId(): number | null {
  if (typeof window === "undefined") return null;

  try {
    const stored = window.localStorage.getItem("trakbin_company");
    if (!stored) return null;

    const parsed = JSON.parse(stored);
    const raw = parsed?.id ?? parsed?.company_id ?? null;
    if (raw == null) return null;

    const num = Number(raw);
    return Number.isFinite(num) ? num : null;
  } catch {
    return null;
  }
}

export function useAnalytics() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [preset, setPreset] = useState<RangePreset>("month");

  const refetch = useCallback(async () => {
    const companyId = getCompanyId();

    if (!companyId) {
      setLoading(false);
      setError("Company session not found. Please log in again.");
      return;
    }

    setLoading(true);
    setError(null);

    const result = await fetchAnalyticsData(companyId);
    setData(result);
    setLoading(false);
  }, []);

  useEffect(() => {
    refetch();
  }, [refetch]);

  const range = useMemo(() => rangeForPreset(preset), [preset]);

  const derived = useMemo(() => {
    if (!data) return null;

    const kpis = computeKpis(data, range);
    const revenueSeries = computeRevenueSeries(data.receipts);
    const growthSeries = computeBuildingGrowth(data.buildings);
    const paymentDist = computePaymentDistribution(data.invoices);
    const fleet = computeFleetSnapshot(data.trucks);
    const insights = computeInsights(data, kpis, revenueSeries, growthSeries);

    return { kpis, revenueSeries, growthSeries, paymentDist, fleet, insights };
  }, [data, range]);

  return {
    data,
    loading,
    error,
    refetch,
    preset,
    setPreset,
    range,
    kpis: derived?.kpis || null,
    revenueSeries: derived?.revenueSeries || [],
    growthSeries: derived?.growthSeries || [],
    paymentDist: derived?.paymentDist || null,
    fleet: derived?.fleet || null,
    insights: derived?.insights || [],
  };
}
// lib/features/finance/hooks/useInvoices.ts
"use client";

import { useCallback, useEffect, useState } from "react";
import {
  fetchBillingPlans,
  fetchInvoices,
  fetchInvoiceStats,
  type BillingPlan,
  type InvoiceRow,
  type InvoiceStats,
} from "../services/billingService";

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

export function useInvoices() {
  const [plans, setPlans] = useState<BillingPlan[]>([]);
  const [invoices, setInvoices] = useState<InvoiceRow[]>([]);
  const [stats, setStats] = useState<InvoiceStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    const companyId = getCompanyId();

    if (!companyId) {
      setLoading(false);
      setError("Company session not found. Please log in again.");
      return;
    }

    setLoading(true);
    setError(null);

    const [plansData, invoicesData, statsData] = await Promise.all([
      fetchBillingPlans(companyId),
      fetchInvoices(companyId),
      fetchInvoiceStats(companyId),
    ]);

    setPlans(plansData);
    setInvoices(invoicesData);
    setStats(statsData);
    setLoading(false);
  }, []);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { plans, invoices, stats, loading, error, refetch };
}
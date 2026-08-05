// lib/features/settings/hooks/useSettings.ts
"use client";

import { useCallback, useEffect, useState } from "react";
import {
  fetchSettingsBundle,
  updateProfile,
  updateSettings,
  createPricingPlan,
  changePlanFee,
  type SettingsBundle,
} from "../services/settingsService";

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

export function useSettings() {
  const [bundle, setBundle] = useState<SettingsBundle | null>(null);
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

    const data = await fetchSettingsBundle(companyId);
    if (!data) {
      setError("Failed to load settings.");
    }
    setBundle(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    refetch();
  }, [refetch]);

  const saveProfile = useCallback(
    async (payload: {
      business_name?: string;
      license_number?: string;
      operating_address?: string;
      contact_number?: string;
    }) => {
      const companyId = getCompanyId();
      if (!companyId) return { ok: false, error: "No company session." };
      const result = await updateProfile(companyId, payload);
      if (result.ok) await refetch();
      return result;
    },
    [refetch]
  );

  const saveSettings = useCallback(
    async (payload: Record<string, unknown>) => {
      const companyId = getCompanyId();
      if (!companyId) return { ok: false, error: "No company session." };
      const result = await updateSettings(companyId, payload);
      if (result.ok) await refetch();
      return result;
    },
    [refetch]
  );

  const addPlan = useCallback(
    async (payload: {
      plan_name: string;
      building_type: string;
      monthly_fee: number;
      effective_date?: string;
    }) => {
      const companyId = getCompanyId();
      if (!companyId) return { ok: false, error: "No company session." };
      const result = await createPricingPlan(companyId, payload);
      if (result.ok) await refetch();
      return result;
    },
    [refetch]
  );

  const changeFee = useCallback(
    async (planId: string, payload: { monthly_fee: number; effective_date: string; reason: string }) => {
      const companyId = getCompanyId();
      if (!companyId) return { ok: false, error: "No company session." };
      const result = await changePlanFee(companyId, planId, payload);
      if (result.ok) await refetch();
      return result;
    },
    [refetch]
  );

  return {
    bundle,
    loading,
    error,
    refetch,
    saveProfile,
    saveSettings,
    addPlan,
    changeFee,
  };
}
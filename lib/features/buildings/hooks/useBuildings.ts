// lib/features/buildings/hooks/useBuildings.ts
"use client";

import { useCallback, useEffect, useState } from "react";
import {
  fetchBuildingsList,
  fetchBuildingDetail,
  type BuildingRecord,
  type BuildingDetail,
} from "../services/buildingService";

export function getBuildingCompanyId(): number | null {
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

export function useBuildings() {
  const [buildings, setBuildings] = useState<BuildingRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    const companyId = getBuildingCompanyId();

    if (!companyId) {
      setLoading(false);
      setError("Company session not found. Please log in again.");
      return;
    }

    setLoading(true);
    setError(null);

    const data = await fetchBuildingsList(companyId);
    setBuildings(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { buildings, loading, error, refetch };
}

export function useBuildingDetail(customId: string | null) {
  const [detail, setDetail] = useState<BuildingDetail | null>(null);
  const [loading, setLoading] = useState(false);

  const refetch = useCallback(async () => {
    const companyId = getBuildingCompanyId();
    if (!customId || !companyId) return;

    setLoading(true);
    const data = await fetchBuildingDetail(customId, companyId);
    setDetail(data);
    setLoading(false);
  }, [customId]);

  useEffect(() => {
    if (!customId) {
      setDetail(null);
      return;
    }
    refetch();
  }, [customId, refetch]);

  return { detail, loading, refetch };
}
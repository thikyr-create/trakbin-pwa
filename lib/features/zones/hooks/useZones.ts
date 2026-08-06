// lib/features/zones/hooks/useZones.ts
"use client";

import { useCallback, useEffect, useState } from "react";
import {
  fetchZones,
  fetchZoneDetail,
  createZone,
  updateZone,
  deleteZone,
  toggleZoneActive,
  autoAssignZones,
  assignBuildingToZone,
  fetchUnassignedBuildings,
  fetchAutoAssignFlag,
  setAutoAssignFlag,
  type ZoneRecord,
  type ZoneDetail,
  type AutoAssignResult,
  type UnassignedBuilding,
} from "../services/zoneService";

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

export function useZones() {
  const [zones, setZones] = useState<ZoneRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [autoAssignEnabled, setAutoAssignEnabled] = useState(true);

  const refetch = useCallback(async () => {
    const companyId = getCompanyId();

    if (!companyId) {
      setLoading(false);
      setError("Company session not found. Please log in again.");
      return;
    }

    setLoading(true);
    setError(null);

    const [data, flag] = await Promise.all([
      fetchZones(companyId),
      fetchAutoAssignFlag(companyId),
    ]);
    setZones(data);
    setAutoAssignEnabled(flag);
    setLoading(false);
  }, []);

  useEffect(() => {
    refetch();
  }, [refetch]);

  const handleCreate = useCallback(
    async (payload: {
      zone_name: string;
      center_lat?: number | null;
      center_lng?: number | null;
      radius_km?: number | null;
      estates?: string[];
      streets?: string[];
      addresses?: string[];
    }) => {
      const companyId = getCompanyId();
      if (!companyId) return { ok: false, error: "No company session." };
      const result = await createZone(companyId, payload);
      if (result.ok) await refetch();
      return result;
    },
    [refetch]
  );

  const handleUpdate = useCallback(
    async (zoneId: string, payload: {
      center_lat?: number | null;
      center_lng?: number | null;
      radius_km?: number | null;
      polygon?: number[][] | null;
      is_active?: boolean;
      estates?: string[];
      streets?: string[];
      addresses?: string[];
    }) => {
      const result = await updateZone(zoneId, payload);
      if (result.ok) await refetch();
      return result;
    },
    [refetch]
  );

  const handleDelete = useCallback(
    async (zoneId: string) => {
      const result = await deleteZone(zoneId);
      if (result.ok) await refetch();
      return result;
    },
    [refetch]
  );

  const handleToggle = useCallback(
    async (zoneId: string, isActive: boolean) => {
      const result = await toggleZoneActive(zoneId, isActive);
      if (result.ok) await refetch();
      return result;
    },
    [refetch]
  );

  /** Runs the zone engine across all unassigned buildings. */
  const runAutoAssign = useCallback(async (): Promise<AutoAssignResult | null> => {
    const companyId = getCompanyId();
    if (!companyId) return null;
    const result = await autoAssignZones(companyId);
    await refetch();
    return result;
  }, [refetch]);

  /** Manual assignment from the needs-review flow. */
  const assignBuilding = useCallback(
    async (buildingId: string, zoneName: string, hasAssignment: boolean) => {
      const companyId = getCompanyId();
      if (!companyId) return { ok: false, error: "No company session." };
      const result = await assignBuildingToZone(companyId, buildingId, zoneName, hasAssignment);
      if (result.ok) await refetch();
      return result;
    },
    [refetch]
  );

  const loadUnassigned = useCallback(async (): Promise<UnassignedBuilding[]> => {
    const companyId = getCompanyId();
    if (!companyId) return [];
    return fetchUnassignedBuildings(companyId);
  }, []);

  const toggleAutoAssign = useCallback(async (enabled: boolean) => {
    const companyId = getCompanyId();
    if (!companyId) return;
    await setAutoAssignFlag(companyId, enabled);
    setAutoAssignEnabled(enabled);
  }, []);

  return {
    zones,
    loading,
    error,
    refetch,
    autoAssignEnabled,
    createZone: handleCreate,
    updateZone: handleUpdate,
    deleteZone: handleDelete,
    toggleZone: handleToggle,
    runAutoAssign,
    assignBuilding,
    loadUnassigned,
    toggleAutoAssign,
  };
}

export function useZoneDetail(zoneId: string | null) {
  const [detail, setDetail] = useState<ZoneDetail | null>(null);
  const [loading, setLoading] = useState(false);

  const refetch = useCallback(async () => {
    const companyId = getCompanyId();
    if (!zoneId || !companyId) return;

    setLoading(true);
    const data = await fetchZoneDetail(zoneId, companyId);
    setDetail(data);
    setLoading(false);
  }, [zoneId]);

  useEffect(() => {
    if (!zoneId) {
      setDetail(null);
      return;
    }
    refetch();
  }, [zoneId, refetch]);

  return { detail, loading, refetch };
}
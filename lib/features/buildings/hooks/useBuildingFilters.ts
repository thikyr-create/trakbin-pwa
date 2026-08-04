// lib/features/buildings/hooks/useBuildingFilters.ts
"use client";

import { useMemo, useState } from "react";
import { matchesBuildingSearch } from "../utils/buildingHelpers";
import type { BuildingRecord } from "../services/buildingService";

export interface BuildingFilterState {
  status: string; // 'all' | status key
  payment: string; // 'all' | payment key
  zone: string; // 'all' | zone_name
  driver: string; // 'all' | 'unassigned' | driver name
  day: string; // 'all' | 'Monday' ...
  type: string; // 'all' | building_type
}

export const DEFAULT_BUILDING_FILTERS: BuildingFilterState = {
  status: "all",
  payment: "all",
  zone: "all",
  driver: "all",
  day: "all",
  type: "all",
};

export interface BuildingFilterCounts {
  status: Record<string, number>;
  payment: Record<string, number>;
  zone: Record<string, number>;
  driver: Record<string, number>;
  day: Record<string, number>;
  type: Record<string, number>;
  unassignedDrivers: number;
}

export function useBuildingFilters(buildings: BuildingRecord[]) {
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<BuildingFilterState>(
    DEFAULT_BUILDING_FILTERS
  );

  const searched = useMemo(() => {
    return buildings.filter((b) => matchesBuildingSearch(b, search));
  }, [buildings, search]);

  const filtered = useMemo(() => {
    return searched.filter((b) => {
      if (filters.status !== "all" && (b.status || "") !== filters.status) {
        return false;
      }
      if (
        filters.payment !== "all" &&
        (b.payment_status || "") !== filters.payment
      ) {
        return false;
      }
      if (filters.zone !== "all" && (b.zone_name || "") !== filters.zone) {
        return false;
      }
      if (filters.type !== "all" && (b.building_type || "") !== filters.type) {
        return false;
      }
      if (filters.day !== "all") {
        const days = (b as any).pickup_days as string[] | null;
        if (!days || !days.includes(filters.day)) return false;
      }
      if (filters.driver !== "all") {
        if (filters.driver === "unassigned") {
          if (b.assigned_driver_name) return false;
        } else if (b.assigned_driver_name !== filters.driver) {
          return false;
        }
      }
      return true;
    });
  }, [searched, filters]);

  const counts = useMemo<BuildingFilterCounts>(() => {
    const c: BuildingFilterCounts = {
      status: {},
      payment: {},
      zone: {},
      driver: {},
      day: {},
      type: {},
      unassignedDrivers: 0,
    };

    buildings.forEach((b) => {
      c.status[b.status || "unknown"] = (c.status[b.status || "unknown"] || 0) + 1;
      c.payment[b.payment_status || "unknown"] =
        (c.payment[b.payment_status || "unknown"] || 0) + 1;

      if (b.zone_name) c.zone[b.zone_name] = (c.zone[b.zone_name] || 0) + 1;
      if (b.building_type)
        c.type[b.building_type] = (c.type[b.building_type] || 0) + 1;

      const days = (b as any).pickup_days as string[] | null;
      (days || []).forEach((d) => {
        c.day[d] = (c.day[d] || 0) + 1;
      });

      if (b.assigned_driver_name) {
        c.driver[b.assigned_driver_name] =
          (c.driver[b.assigned_driver_name] || 0) + 1;
      } else {
        c.unassignedDrivers += 1;
      }
    });

    return c;
  }, [buildings]);

  const activeCount = useMemo(() => {
    return Object.values(filters).filter((v) => v !== "all").length;
  }, [filters]);

  const reset = () => {
    setFilters(DEFAULT_BUILDING_FILTERS);
    setSearch("");
  };

  return {
    search,
    setSearch,
    filters,
    setFilters,
    searched,
    filtered,
    counts,
    activeCount,
    reset,
  };
}
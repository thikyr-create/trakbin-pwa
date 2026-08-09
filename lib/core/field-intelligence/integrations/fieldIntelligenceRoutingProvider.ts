// lib/core/field-intelligence/integrations/fieldIntelligenceRoutingProvider.ts
import type { GeoPoint, RouteMatrix, RouteResult, RoutingProvider } from '@/lib/core/route-optimization/types/routeOptimization.types';
import { fieldIntelligenceService } from '../services/fieldIntelligenceService';

/**
 * Wraps any RoutingProvider and enriches duration estimates with learned
 * per-stop service times. Confidence-gated via fieldIntelligenceService.consume:
 * no learned value (or weak confidence) → underlying estimate passes through.
 *
 * Model: duration[i][j] += serviceTime[j]. Each stop is entered exactly once
 * in a route, so its service time is counted exactly once. Correct by construction.
 */
export class FieldIntelligenceRoutingProvider implements RoutingProvider {
  readonly name: 'mapbox' | 'haversine';
  private stopContext: (string | null)[] = [];

  constructor(
    private inner: RoutingProvider,
    private companyId: number | null
  ) {
    this.name = inner.name;
  }

  /** Align stop building_ids with the points array passed to getRouteMatrix ([depot, ...stops]). */
  setStopContext(buildingIds: (string | null)[]): void {
    this.stopContext = buildingIds;
  }

  async getRouteMatrix(locations: GeoPoint[], avgSpeedKmh = 25): Promise<RouteMatrix> {
    const base = await this.inner.getRouteMatrix(locations, avgSpeedKmh);
    const service = await this.learnedServiceTimes();
    if (service.length === 0) return base;

    const durationMinutes = base.durationMinutes.map((row, i) =>
      row.map((d, j) => (i === j ? d : d + (service[j] ?? 0)))
    );

    return { ...base, durationMinutes };
  }

  async getRoute(locations: GeoPoint[], avgSpeedKmh = 25): Promise<RouteResult> {
    const base = await this.inner.getRoute(locations, avgSpeedKmh);
    const service = await this.learnedServiceTimes();
    const totalService = service.reduce((s, t) => s + t, 0);
    return { ...base, durationMinutes: base.durationMinutes + totalService };
  }

  /** Index-aligned with points ([0 = depot, ...stop service times]). */
  private async learnedServiceTimes(): Promise<number[]> {
    if (!this.companyId || this.stopContext.length === 0) return [];
    const out: number[] = [0];
    for (const id of this.stopContext) {
      out.push(id ? ((await this.serviceTimeFor(id)) ?? 0) : 0);
    }
    return out;
  }

  /** Learned service time (minutes) for one building, or null when not confident. */
  async serviceTimeFor(buildingId: string): Promise<number | null> {
    if (!this.companyId) return null;
    const rec = await fieldIntelligenceService.consume(this.companyId, 'building', buildingId, 'collection_pattern');
    const min = (rec?.value as any)?.avgStopMin;
    return typeof min === 'number' && min > 0 ? min : null;
  }
}

export function withFieldIntelligence(inner: RoutingProvider, companyId: number | null): FieldIntelligenceRoutingProvider {
  return new FieldIntelligenceRoutingProvider(inner, companyId);
}
import type { GeoPoint, RouteMatrix, RouteResult, RoutingProvider } from '../types/routeOptimization.types';

const R = 6371;
export function haversineKm(a: GeoPoint, b: GeoPoint): number {
  const dLat = ((b.latitude - a.latitude) * Math.PI) / 180;
  const dLng = ((b.longitude - a.longitude) * Math.PI) / 180;
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((a.latitude * Math.PI) / 180) * Math.cos((b.latitude * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}

/** Fallback provider: geographic distance + speed-based time estimate. */
export class HaversineProvider implements RoutingProvider {
  readonly name = 'haversine' as const;

  async getRouteMatrix(locations: GeoPoint[], avgSpeedKmh = 25): Promise<RouteMatrix> {
    const n = locations.length;
    const distanceKm: number[][] = [];
    const durationMinutes: number[][] = [];
    for (let i = 0; i < n; i++) {
      distanceKm.push([]); durationMinutes.push([]);
      for (let j = 0; j < n; j++) {
        const d = i === j ? 0 : haversineKm(locations[i], locations[j]) * 1.25; // road-factor
        distanceKm[i].push(Math.round(d * 100) / 100);
        durationMinutes[i].push(Math.round((d / avgSpeedKmh) * 60));
      }
    }
    return { distanceKm, durationMinutes, source: 'haversine' };
  }

  async getRoute(locations: GeoPoint[], avgSpeedKmh = 25): Promise<RouteResult> {
    let d = 0;
    for (let i = 0; i < locations.length - 1; i++) d += haversineKm(locations[i], locations[i + 1]) * 1.25;
    return { distanceKm: Math.round(d * 100) / 100, durationMinutes: Math.round((d / avgSpeedKmh) * 60), source: 'haversine' };
  }
}
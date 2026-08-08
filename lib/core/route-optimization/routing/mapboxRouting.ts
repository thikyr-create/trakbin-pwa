import type { GeoPoint, RouteMatrix, RouteResult, RoutingProvider } from '../types/routeOptimization.types';

const BASE = 'https://api.mapbox.com';

/** Road-network provider. Throws on failure so the runner falls back to haversine. */
export class MapboxProvider implements RoutingProvider {
  readonly name = 'mapbox' as const;
  constructor(private token: string) {}

  private coords(locations: GeoPoint[]): string {
    return locations.map((l) => `${l.longitude},${l.latitude}`).join(';');
  }

  async getRouteMatrix(locations: GeoPoint[]): Promise<RouteMatrix> {
    const url = `${BASE}/directions-matrix/v1/mapbox/driving/${this.coords(locations)}?annotations=duration,distance`;
    const res = await fetch(url, { headers: { Authorization: `Bearer ${this.token}` } });
    const json = await res.json();
    if (!res.ok || !json.durations || !json.distances) throw new Error(`mapbox_matrix_failed: ${json.message ?? res.status}`);
    const n = locations.length;
    const durationMinutes: number[][] = [];
    const distanceKm: number[][] = [];
    for (let i = 0; i < n; i++) {
      durationMinutes.push(json.durations[i].map((s: number) => Math.round((s ?? 0) / 60)));
      distanceKm.push(json.distances[i].map((m: number) => Math.round(((m ?? 0) / 1000) * 100) / 100));
    }
    return { distanceKm, durationMinutes, source: 'mapbox' };
  }

  async getRoute(locations: GeoPoint[]): Promise<RouteResult> {
    const url = `${BASE}/directions/v5/mapbox/driving/${this.coords(locations)}?geometries=geojson&overview=full`;
    const res = await fetch(url, { headers: { Authorization: `Bearer ${this.token}` } });
    const json = await res.json();
    if (!res.ok || !json.routes?.[0]) throw new Error(`mapbox_route_failed: ${json.message ?? res.status}`);
    const r = json.routes[0];
    return { distanceKm: Math.round((r.distance / 1000) * 100) / 100, durationMinutes: Math.round(r.duration / 60), geometry: r.geometry, source: 'mapbox' };
  }
}
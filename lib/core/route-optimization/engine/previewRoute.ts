// lib/core/route-optimization/engine/previewRoute.ts
import type { OptimizationStop } from '../models/OptimizationStop';
import { HaversineProvider } from '../routing/routeMatrix';
import { optimizeSingle } from './routeOptimizer';

/**
 * Client-safe route preview: haversine-only (no Mapbox, no network calls).
 * Use for live UI previews while users select buildings.
 * For actual route materialization, use `optimizeRoute()` instead.
 */
export async function previewRoute(stops: OptimizationStop[]): Promise<{
  orderedStops: OptimizationStop[];
  distanceKm: number;
  durationMinutes: number;
  source: 'haversine';
}> {
  if (stops.length === 0) {
    return { orderedStops: [], distanceKm: 0, durationMinutes: 0, source: 'haversine' };
  }
  if (stops.length === 1) {
    return { orderedStops: stops, distanceKm: 0, durationMinutes: 5, source: 'haversine' };
  }
  const depot = { latitude: stops[0].latitude, longitude: stops[0].longitude };
  const points = [depot, ...stops.map((s) => ({ latitude: s.latitude, longitude: s.longitude }))];
  const matrix = await new HaversineProvider().getRouteMatrix(points, 25);
  const result = optimizeSingle(stops, matrix);
  return {
    orderedStops: result.orderedStops,
    distanceKm: result.metrics.totalDistanceKm,
    durationMinutes: result.metrics.estimatedDurationMin,
    source: 'haversine',
  };
}
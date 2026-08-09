import type { OptimizationInput, RouteMatrix } from '../types/routeOptimization.types';
import type { OptimizedRoute } from '../models/OptimizedRoute';
import type { GeoPoint } from '../types/routeOptimization.types';
import { OptimizationError } from '../errors/optimizationErrors';
import { chunkStops } from '../constraints/maxStops';
import { getRoutingProvider } from '../routing/routingProvider';
import { HaversineProvider } from '../routing/routeMatrix';
import { optimizeSingle } from './routeOptimizer';
import { withFieldIntelligence } from '@/lib/core/field-intelligence/integrations/fieldIntelligenceRoutingProvider';
const isValidCoord = (lat: number, lng: number) =>
  Number.isFinite(lat) && Number.isFinite(lng) && !(lat === 0 && lng === 0);

async function safeMatrix(provider: ReturnType<typeof getRoutingProvider>, points: GeoPoint[], speed?: number): Promise<RouteMatrix> {
  try {
    return await provider.getRouteMatrix(points, speed);
  } catch {
    return new HaversineProvider().getRouteMatrix(points, speed);
  }
}

export interface OptimizationResult {
  orderedStops: OptimizationInput['stops'];
  routes: OptimizedRoute[];
  totalDistanceKm: number;
  estimatedDurationMin: number;
  algorithm: string;
  matrixSource: 'mapbox' | 'haversine';
}

export async function runOptimization(input: OptimizationInput): Promise<OptimizationResult> {
  const valid = (input.stops ?? []).filter((s) => isValidCoord(s.latitude, s.longitude));
  if (valid.length === 0) throw new OptimizationError('NO_VALID_STOPS', 'No stops with valid coordinates.');

  const constraints = input.constraints ?? {};
  const chunks = chunkStops(valid, constraints.maxStopsPerRoute);
   const companyId = (input as any).companyId ?? (constraints as any).companyId ?? null;
  const provider = withFieldIntelligence(getRoutingProvider(), companyId);

  const routes: OptimizedRoute[] = [];
  for (const chunk of chunks) {
    const depot: GeoPoint = input.startLocation ?? { latitude: chunk[0].latitude, longitude: chunk[0].longitude };
    const points: GeoPoint[] = [depot, ...chunk.map((s) => ({ latitude: s.latitude, longitude: s.longitude }))];
        provider.setStopContext(chunk.map((s: any) => s.building_id ?? null));
    const matrix = await safeMatrix(provider, points, constraints.averageSpeedKmh);
    routes.push(optimizeSingle(chunk, matrix, constraints));
  }

  const totalDistanceKm = Math.round(routes.reduce((s, r) => s + r.metrics.totalDistanceKm, 0) * 100) / 100;
  const estimatedDurationMin = routes.reduce((s, r) => s + r.metrics.estimatedDurationMin, 0);

  return {
    orderedStops: routes.flatMap((r) => r.orderedStops),
    routes,
    totalDistanceKm,
    estimatedDurationMin,
    algorithm: 'nearest-neighbor+2-opt',
    matrixSource: routes[0]?.matrixSource ?? 'haversine',
  };
}
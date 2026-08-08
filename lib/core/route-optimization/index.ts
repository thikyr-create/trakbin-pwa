import { runOptimization, type OptimizationResult } from './engine/optimizationRunner';
import type { OptimizationInput } from './types/routeOptimization.types';

/** Public API: "Given these stops, what is the best order?" */
export async function optimizeRoute(input: OptimizationInput): Promise<OptimizationResult> {
  return runOptimization(input);
}

export { runOptimization } from './engine/optimizationRunner';
export { getRoutingProvider } from './routing/routingProvider';
export { haversineKm } from './routing/routeMatrix';
export * from './models/OptimizationStop';
export * from './models/OptimizedRoute';
export * from './models/RouteMetrics';
export * from './types/routeOptimization.types';
export * from './errors/optimizationErrors';
export { previewRoute } from './engine/previewRoute';
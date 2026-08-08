import type { OptimizationStop } from './OptimizationStop';
import type { RouteMetrics } from './RouteMetrics';

export interface OptimizedRoute {
  orderedStops: OptimizationStop[];
  metrics: RouteMetrics;
  algorithm: string;
  matrixSource: 'mapbox' | 'haversine';
}
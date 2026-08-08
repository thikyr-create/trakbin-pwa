import type { RouteMetrics } from '../models/RouteMetrics';
import type { OptimizationConstraints } from '../types/routeOptimization.types';

export function fitsWorkingHours(metrics: RouteMetrics, c?: OptimizationConstraints): boolean {
  if (c?.workStartMinutes == null || c?.workEndMinutes == null) return true;
  return metrics.estimatedDurationMin <= c.workEndMinutes - c.workStartMinutes;
}
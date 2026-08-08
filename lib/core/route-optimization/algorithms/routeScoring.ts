import type { OptimizationStop } from '../models/OptimizationStop';
import type { RouteMetrics } from '../models/RouteMetrics';
import type { OptimizationConstraints, RouteMatrix } from '../types/routeOptimization.types';
import { parseTimeToMinutes } from '../constraints/collectionConstraints';

const r2 = (n: number) => Math.round(n * 100) / 100;

/** "Best" = distance + time + violations − priority. A seam for future weights. */
export function computeMetrics(
  stops: OptimizationStop[],
  order: number[],
  matrix: RouteMatrix,
  constraints?: OptimizationConstraints
): RouteMetrics {
  let distance = 0, travel = 0, service = 0, violations = 0, priority = 0;
  let clock = constraints?.workStartMinutes ?? 8 * 60;
  let prev = 0;

  for (const idx of order) {
    distance += matrix.distanceKm[prev][idx];
    const leg = matrix.durationMinutes[prev][idx];
    travel += leg;
    clock += leg;

    const stop = stops[idx - 1];
    if (stop.preferredTimeWindow) {
      const ws = parseTimeToMinutes(stop.preferredTimeWindow.start);
      const we = parseTimeToMinutes(stop.preferredTimeWindow.end);
      if (clock < ws || clock > we) violations++;
    }

    const svc = stop.serviceDurationMinutes ?? 5;
    clock += svc;
    service += svc;
    priority += stop.priority ?? 0;
    prev = idx;
  }

  const estimatedDurationMin = travel + service;
  const score = distance + estimatedDurationMin * 0.5 + violations * 10 - priority * 0.1;

  return {
    totalDistanceKm: r2(distance),
    travelTimeMin: Math.round(travel),
    serviceTimeMin: Math.round(service),
    estimatedDurationMin: Math.round(estimatedDurationMin),
    timeWindowViolations: violations,
    priorityScore: priority,
    score: r2(score),
  };
}
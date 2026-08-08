import type { OptimizationStop } from '../models/OptimizationStop';
import type { OptimizedRoute } from '../models/OptimizedRoute';
import type { OptimizationConstraints, RouteMatrix } from '../types/routeOptimization.types';
import { nearestNeighborOrder } from '../algorithms/nearestNeighbor';
import { twoOptImprove } from '../algorithms/twoOpt';
import { computeMetrics } from '../algorithms/routeScoring';

/** Optimize one chunk against a matrix. Index 0 in the matrix is the depot. */
export function optimizeSingle(
  stops: OptimizationStop[],
  matrix: RouteMatrix,
  constraints?: OptimizationConstraints
): OptimizedRoute {
  const dist = (a: number, b: number) => matrix.durationMinutes[a][b]; // optimize on time
  const nn = nearestNeighborOrder(stops.length, dist);
  const order = twoOptImprove(nn, dist);
  const orderedStops = order.map((i) => stops[i - 1]);
  const metrics = computeMetrics(stops, order, matrix, constraints);
  return { orderedStops, metrics, algorithm: 'nearest-neighbor+2-opt', matrixSource: matrix.source };
}
import type { OptimizationStop } from '../models/OptimizationStop';

export function totalVolume(stops: OptimizationStop[]): number {
  return stops.reduce((s, x) => s + (x.wasteVolume ?? 0), 0);
}
export function fitsCapacity(stops: OptimizationStop[], capacity?: number | null): boolean {
  if (!capacity) return true;
  return totalVolume(stops) <= capacity;
}
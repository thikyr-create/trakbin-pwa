import type { OptimizationStop } from '../models/OptimizationStop';

export function chunkStops(stops: OptimizationStop[], max?: number): OptimizationStop[][] {
  if (!max || max <= 0) return [stops];
  const chunks: OptimizationStop[][] = [];
  for (let i = 0; i < stops.length; i += max) chunks.push(stops.slice(i, i + max));
  return chunks;
}
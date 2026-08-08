import type { RoutingProvider } from '../types/routeOptimization.types';
import { MapboxProvider } from './mapboxRouting';
import { HaversineProvider } from './routeMatrix';

/** Mapbox when a token exists; haversine otherwise. The optimizer never knows which. */
export function getRoutingProvider(): RoutingProvider {
  const token = process.env.MAPBOX_TOKEN || process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
  if (token) return new MapboxProvider(token);
  return new HaversineProvider();
}
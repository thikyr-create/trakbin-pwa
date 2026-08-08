// lib/core/maps/services/routingService.ts
import type { RoutingProvider } from '../interfaces/routingProvider';
import type { Coordinates, Route } from '../types';
import { MapboxRouting } from '../providers/mapbox/mapboxRouting';
const provider: RoutingProvider = new MapboxRouting();
export const routingService = { async getRoute(p: Coordinates[]): Promise<Route> { return provider.getRoute(p); } };

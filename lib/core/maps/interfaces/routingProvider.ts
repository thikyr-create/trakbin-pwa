// lib/core/maps/interfaces/routingProvider.ts
import type { Coordinates, Route } from '../types';
export interface RoutingProvider {
  readonly name: string;
  getRoute(points: Coordinates[]): Promise<Route>;
}
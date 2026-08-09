// lib/core/field-intelligence/models/RouteObservation.ts
export interface RouteObservation {
  routeId: string;
  ts: string;
  onRoute: boolean;
  deviationDistanceM?: number | null;
  segmentFrom?: string | null;
  segmentTo?: string | null;
}
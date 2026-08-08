export interface GeoPoint { latitude: number; longitude: number; }
export interface TimeWindow { start: string; end: string; } // "08:00"

export interface OptimizationConstraints {
  maxStopsPerRoute?: number;
  averageSpeedKmh?: number;      // used by haversine fallback
  workStartMinutes?: number;     // minutes from midnight
  workEndMinutes?: number;
  vehicleCapacity?: number | null;
}

export interface OptimizationInput {
  stops: import('../models/OptimizationStop').OptimizationStop[];
  startLocation?: GeoPoint | null;
  endLocation?: GeoPoint | null;
  constraints?: OptimizationConstraints;
}

export interface RouteMatrix {
  distanceKm: number[][];        // [i][j], index 0 = start
  durationMinutes: number[][];
  source: 'mapbox' | 'haversine';
}

export interface RouteResult {
  distanceKm: number;
  durationMinutes: number;
  geometry?: unknown;
  source: 'mapbox' | 'haversine';
}

export interface RoutingProvider {
  readonly name: 'mapbox' | 'haversine';
  getRouteMatrix(locations: GeoPoint[], avgSpeedKmh?: number): Promise<RouteMatrix>;
  getRoute(locations: GeoPoint[], avgSpeedKmh?: number): Promise<RouteResult>;
}
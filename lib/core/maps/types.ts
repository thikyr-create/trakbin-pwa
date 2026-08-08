// lib/core/maps/types.ts
export interface Coordinates { lat: number; lng: number; }

export interface GeocodingResult {
  latitude: number;
  longitude: number;
  formattedAddress: string;
  confidence: 'high' | 'medium' | 'low';
  raw?: unknown;
}

export interface ReverseGeocodingResult {
  formattedAddress: string | null;
  locality?: string | null;
  postcode?: string | null;
  raw?: unknown;
}

export interface RouteStep {
  instruction: string;
  distanceM: number;
  durationSec: number;
  geometry?: unknown;
}

export interface Route {
  distanceKm: number;
  durationMin: number;
  geometry: unknown;
  steps?: RouteStep[];
  source: 'mapbox' | 'haversine';
  raw?: unknown;
}

export interface RouteMatrix {
  distanceKm: number[][];
  durationMin: number[][];
  source: 'mapbox' | 'haversine';
}

export interface NavigationInstruction {
  text: string;
  distanceM: number;
  durationSec: number;
  bearing?: number;
  modifier?: string;
}

export interface MatchedLocation {
  latitude: number;
  longitude: number;
  confidence: number;
  roadName?: string | null;
  raw?: unknown;
}

export interface PlaceSearchResult {
  id: string;
  label: string;
  coordinates: Coordinates;
  type: 'place' | 'building' | 'address';
  buildingId?: string;
  raw?: unknown;
}
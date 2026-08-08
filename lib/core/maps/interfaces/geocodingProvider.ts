// lib/core/maps/interfaces/geocodingProvider.ts
import type { Coordinates, GeocodingResult, ReverseGeocodingResult } from '../types';
export interface GeocodingProvider {
  readonly name: string;
  geocode(query: string): Promise<GeocodingResult[]>;
  reverseGeocode(coord: Coordinates): Promise<ReverseGeocodingResult | null>;
}


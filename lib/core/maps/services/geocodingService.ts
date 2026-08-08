// lib/core/maps/services/geocodingService.ts
import type { GeocodingProvider } from '../interfaces/geocodingProvider';
import type { Coordinates, GeocodingResult, ReverseGeocodingResult } from '../types';
import { MapboxGeocoding } from '../providers/mapbox/mapboxGeocoding';

const provider: GeocodingProvider = new MapboxGeocoding();

export const geocodingService = {
  async geocode(q: string): Promise<GeocodingResult[]> { return provider.geocode(q); },
  async reverseGeocode(c: Coordinates): Promise<ReverseGeocodingResult | null> { return provider.reverseGeocode(c); },
};

// lib/core/maps/providers/mapbox/mapboxGeocoding.ts
import type { GeocodingProvider, } from '../../interfaces/geocodingProvider';
import type { Coordinates, GeocodingResult, ReverseGeocodingResult } from '../../types';
import { mapboxFetch } from './client';

export class MapboxGeocoding implements GeocodingProvider {
  readonly name = 'mapbox';

  async geocode(query: string): Promise<GeocodingResult[]> {
    const json = await mapboxFetch(`/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json`, { limit: '5' });
    return (json.features || []).map((f: any) => ({
      latitude: f.center[1],
      longitude: f.center[0],
      formattedAddress: f.place_name,
      confidence: (f.relevance ?? 0) > 0.85 ? 'high' : (f.relevance ?? 0) > 0.5 ? 'medium' : 'low',
      raw: f,
    }));
  }

  async reverseGeocode(coord: Coordinates): Promise<ReverseGeocodingResult | null> {
    const json = await mapboxFetch(`/geocoding/v5/mapbox.places/${coord.lng},${coord.lat}.json`, { limit: '1' });
    const f = json.features?.[0];
    if (!f) return null;
    return {
      formattedAddress: f.place_name ?? null,
      locality: f.context?.find((c: any) => c.id?.startsWith('place'))?.text ?? null,
      postcode: f.context?.find((c: any) => c.id?.startsWith('postcode'))?.text ?? null,
      raw: f,
    };
  }
}
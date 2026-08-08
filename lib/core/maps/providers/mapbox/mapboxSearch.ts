// lib/core/maps/providers/mapbox/mapboxSearch.ts
import type { SearchProvider } from '../../interfaces/searchProvider';
import type { PlaceSearchResult } from '../../types';
import { mapboxFetch } from './client';

export class MapboxSearch implements SearchProvider {
  readonly name = 'mapbox';

  async search(query: string, limit = 5): Promise<PlaceSearchResult[]> {
    const json = await mapboxFetch(`/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json`, { limit: String(limit) });
    return (json.features || []).map((f: any) => ({
      id: f.id,
      label: f.place_name,
      coordinates: { lat: f.center[1], lng: f.center[0] },
      type: 'place',
      raw: f,
    }));
  }
}
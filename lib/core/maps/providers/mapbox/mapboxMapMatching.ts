// lib/core/maps/providers/mapbox/mapboxMapMatching.ts
import type { MapMatchingProvider } from '../../interfaces/mapMatchingProvider';
import type { Coordinates, MatchedLocation } from '../../types';
import { mapboxFetch } from './client';

export class MapboxMapMatching implements MapMatchingProvider {
  readonly name = 'mapbox';

  async match(trace: Coordinates[]): Promise<MatchedLocation[]> {
    if (trace.length < 2) return trace.map((t) => ({ latitude: t.lat, longitude: t.lng, confidence: 0 }));
    const coords = trace.map((p) => `${p.lng},${p.lat}`).join(';');
    try {
      const json = await mapboxFetch(`/matching/v5/mapbox/driving/${coords}`, {
        geometries: 'geojson',
        overview: 'full',
        tidy: 'true',
        annotations: 'false',
      });
      return (json.matchings?.[0]?.geometry?.coordinates || []).map(
        (c: [number, number]) => ({ latitude: c[1], longitude: c[0], confidence: 0.95 })
      );
    } catch {
      // Mapbox rejects short/noisy traces; degrade to raw coords
      return trace.map((t) => ({ latitude: t.lat, longitude: t.lng, confidence: 0 }));
    }
  }
}
// lib/core/maps/providers/mapbox/mapboxRouting.ts
import type { RoutingProvider } from '../../interfaces/routingProvider';
import type { Coordinates, Route } from '../../types';
import { mapboxFetch } from './client';

export class MapboxRouting implements RoutingProvider {
  readonly name = 'mapbox';

  async getRoute(points: Coordinates[]): Promise<Route> {
    const coords = points.map((p) => `${p.lng},${p.lat}`).join(';');
    const json = await mapboxFetch(`/directions/v5/mapbox/driving/${coords}`, {
      geometries: 'geojson',
      overview: 'full',
      steps: 'true',
    });
    const r = json.routes?.[0];
    if (!r) throw new Error('mapbox: no_route_returned');
    return {
      distanceKm: Math.round((r.distance / 1000) * 100) / 100,
      durationMin: Math.round(r.duration / 60),
      geometry: r.geometry,
      steps: (r.legs || []).flatMap((leg: any) => (leg.steps || []).map((s: any) => ({
        instruction: s.maneuver?.instruction ?? '',
        distanceM: s.distance ?? 0,
        durationSec: s.duration ?? 0,
      }))),
      source: 'mapbox',
      raw: r,
    };
  }
}
// lib/core/maps/providers/mapbox/mapboxNavigation.ts
import type { NavigationProvider } from '../../interfaces/navigationProvider';
import type { Coordinates, NavigationInstruction } from '../../types';
import { mapboxFetch } from './client';

export class MapboxNavigation implements NavigationProvider {
  readonly name = 'mapbox';

  async getInstructions(points: Coordinates[]): Promise<NavigationInstruction[]> {
    const coords = points.map((p) => `${p.lng},${p.lat}`).join(';');
    const json = await mapboxFetch(`/directions/v5/mapbox/driving/${coords}`, {
      geometries: 'geojson',
      steps: 'true',
      banner_instructions: 'true',
    });
    return (json.routes?.[0]?.legs || []).flatMap((leg: any) =>
      (leg.steps || []).map((s: any) => ({
        text: s.maneuver?.instruction ?? '',
        distanceM: s.distance ?? 0,
        durationSec: s.duration ?? 0,
        bearing: s.maneuver?.bearing_before,
        modifier: s.maneuver?.modifier,
      }))
    );
  }
}
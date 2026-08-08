// lib/core/maps/providers/mapbox/mapboxMatrix.ts
import type { MatrixProvider } from '../../interfaces/matrixProvider';
import type { Coordinates, RouteMatrix } from '../../types';
import { mapboxFetch } from './client';

export class MapboxMatrix implements MatrixProvider {
  readonly name = 'mapbox';

  async getMatrix(points: Coordinates[]): Promise<RouteMatrix> {
    const coords = points.map((p) => `${p.lng},${p.lat}`).join(';');
    const json = await mapboxFetch(`/directions-matrix/v1/mapbox/driving/${coords}`, {
      annotations: 'duration,distance',
    });
    if (!json.durations || !json.distances) throw new Error('mapbox: matrix_failed');
    return {
      distanceKm: json.distances.map((row: number[]) => row.map((m) => Math.round((m / 1000) * 100) / 100)),
      durationMin: json.durations.map((row: number[]) => row.map((s) => Math.round((s ?? 0) / 60))),
      source: 'mapbox',
    };
  }
}
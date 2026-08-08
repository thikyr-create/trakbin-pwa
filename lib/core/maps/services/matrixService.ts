// lib/core/maps/services/matrixService.ts
import type { MatrixProvider } from '../interfaces/matrixProvider';
import type { Coordinates, RouteMatrix } from '../types';
import { MapboxMatrix } from '../providers/mapbox/mapboxMatrix';
const provider: MatrixProvider = new MapboxMatrix();
export const matrixService = { async getMatrix(p: Coordinates[]): Promise<RouteMatrix> { return provider.getMatrix(p); } };

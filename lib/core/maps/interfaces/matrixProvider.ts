// lib/core/maps/interfaces/matrixProvider.ts
import type { Coordinates, RouteMatrix } from '../types';
export interface MatrixProvider {
  readonly name: string;
  getMatrix(points: Coordinates[]): Promise<RouteMatrix>;
}

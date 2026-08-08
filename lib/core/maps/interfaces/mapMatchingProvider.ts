// lib/core/maps/interfaces/mapMatchingProvider.ts
import type { Coordinates, MatchedLocation } from '../types';
export interface MapMatchingProvider {
  readonly name: string;
  match(trace: Coordinates[]): Promise<MatchedLocation[]>;
}
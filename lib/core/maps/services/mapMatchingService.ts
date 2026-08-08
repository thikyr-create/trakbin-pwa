// lib/core/maps/services/mapMatchingService.ts
import type { MapMatchingProvider } from '../interfaces/mapMatchingProvider';
import type { Coordinates, MatchedLocation } from '../types';
import { MapboxMapMatching } from '../providers/mapbox/mapboxMapMatching';
const provider: MapMatchingProvider = new MapboxMapMatching();
export const mapMatchingService = { async match(trace: Coordinates[]): Promise<MatchedLocation[]> { return provider.match(trace); } };

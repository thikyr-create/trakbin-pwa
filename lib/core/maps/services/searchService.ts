// lib/core/maps/services/searchService.ts
import type { SearchProvider } from '../interfaces/searchProvider';
import type { PlaceSearchResult } from '../types';
import { MapboxSearch } from '../providers/mapbox/mapboxSearch';
const provider: SearchProvider = new MapboxSearch();
export const searchService = { async search(q: string, limit?: number): Promise<PlaceSearchResult[]> { return provider.search(q, limit); } };
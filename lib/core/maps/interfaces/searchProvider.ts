// lib/core/maps/interfaces/searchProvider.ts
import type { PlaceSearchResult } from '../types';
export interface SearchProvider {
  readonly name: string;
  search(query: string, limit?: number): Promise<PlaceSearchResult[]>;
}
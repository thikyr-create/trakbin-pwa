// src/services/mapService.ts
//
// Map abstraction layer: providers are pluggable (Mapbox, Google, ...).
// The factory selects the first available provider at runtime.
// Mirrors the PWA's lib/core/maps architecture.

import { MapProvider, MapRoute, GeocodeResult } from './maps/types';

export abstract class MapService {
  abstract getProvider(): MapProvider;
  abstract getRoute(
    origin: [number, number],
    destination: [number, number]
  ): Promise<MapRoute | null>;
  abstract searchGeocode(query: string): Promise<GeocodeResult[]>;
}

export class MapServiceFactory {
  private static instance: MapService | null = null;

  static getService(): MapService {
    if (this.instance) return this.instance;

    // Try providers in order of preference
    try {
      const { MapboxMapService } = require('./maps/providers/mapbox');
      const mapbox = new MapboxMapService();
      if (mapbox.getProvider().isAvailable()) {
        this.instance = mapbox;
        return mapbox;
      }
    } catch (e) {
      console.warn('Mapbox provider unavailable:', e);
    }

    try {
      const { GoogleMapService } = require('./maps/providers/google');
      const google = new GoogleMapService();
      this.instance = google;
      return google;
    } catch (e) {
      console.warn('Google Maps provider unavailable:', e);
    }

    throw new Error('No map service provider available');
  }

  static reset(): void {
    this.instance = null;
  }
}
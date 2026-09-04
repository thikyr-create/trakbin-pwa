import { MapService } from '../../mapService';
import { MapProvider, MapRoute, GeocodeResult } from '../types';

export class GoogleMapService extends MapService {
  private apiKey: string | null = process.env.EXPO_PUBLIC_GOOGLE_MAPS_KEY || null;

  getProvider(): MapProvider {
    return {
      name: 'Google Maps',
      getApiKey: () => this.apiKey,
      isAvailable: () => !!this.apiKey,
    };
  }

  async getRoute(
    origin: [number, number],
    destination: [number, number]
  ): Promise<MapRoute | null> {
    // Google Maps Directions API placeholder
    console.warn('Google Maps routing not yet implemented');
    return null;
  }

  async searchGeocode(query: string): Promise<GeocodeResult[]> {
    // Google Maps Geocoding API placeholder
    console.warn('Google Maps geocoding not yet implemented');
    return [];
  }
}
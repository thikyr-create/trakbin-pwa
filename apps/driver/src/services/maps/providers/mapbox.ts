import { MapService } from '../../mapService';
import { MapProvider, MapRoute, GeocodeResult } from '../types';

export class MapboxMapService extends MapService {
  private apiKey: string | null = process.env.EXPO_PUBLIC_MAPBOX_TOKEN || null;

  getProvider(): MapProvider {
    return {
      name: 'Mapbox',
      getApiKey: () => this.apiKey,
      isAvailable: () => !!this.apiKey,
    };
  }

  async getRoute(
    origin: [number, number],
    destination: [number, number]
  ): Promise<MapRoute | null> {
    if (!this.apiKey) return null;
    
    try {
      const response = await fetch(
        `https://api.mapbox.com/directions/v5/mapbox/driving/${origin[0]},${origin[1]};${destination[0]},${destination[1]}?access_token=${this.apiKey}&geometries=polyline`
      );
      const data = await response.json();
      
      if (!data.routes?.length) return null;
      
      const route = data.routes[0];
      return {
        distanceMeters: route.distance,
        durationSeconds: route.duration,
        geometry: route.geometry,
      };
    } catch (e) {
      console.error('Mapbox route error:', e);
      return null;
    }
  }

  async searchGeocode(query: string): Promise<GeocodeResult[]> {
    if (!this.apiKey) return [];
    
    try {
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${this.apiKey}&limit=5`
      );
      const data = await response.json();
      
      if (!data.features) return [];
      
      return data.features.map((feature: any) => ({
        id: `place-${feature.id}`,
        place_name: feature.place_name,
        center: feature.center,
        type: 'place',
      }));
    } catch (e) {
      console.error('Mapbox geocode error:', e);
      return [];
    }
  }
}
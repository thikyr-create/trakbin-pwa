export interface MapProvider {
  name: string;
  getApiKey(): string | null;
  isAvailable(): boolean;
}

export interface MapRoute {
  distanceMeters: number;
  durationSeconds: number;
  geometry: string;
}

export interface GeocodeResult {
  id: string;
  place_name: string;
  center: [number, number];
  type: 'building' | 'place';
  buildingId?: string;
}
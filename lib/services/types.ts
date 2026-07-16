// lib/services/types.ts

export interface Building {
  custom_id: string;
  latitude: number;
  longitude: number;
  address: string;
  status: 'pending' | 'picked_up' | 'issue';
  building_type?: string;
  payment_status?: string;
}

export interface RouteResult {
  buildings: Building[];
  totalDistance: number;
  estimatedTime: number;
}

export interface NavigationResult {
  duration: number; // seconds
  distance: number; // meters
  geometry: any; // Mapbox geometry for drawing the route line
}

export interface CollectionEvent {
  id?: string;
  building_id: string;
  action: 'complete' | 'issue';
  issue_type?: string;
  timestamp: string;
  synced: boolean;
}
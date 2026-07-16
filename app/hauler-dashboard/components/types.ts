import mapboxgl from 'mapbox-gl';

export interface DriverLocation {
  latitude: number;
  longitude: number;
  heading?: number | null;
  speed?: number | null;
  timestamp: number;
}

export interface DriverRoute {
  id: string;
  company_id: string;
  driver_id: string;
  truck_id: string;
  zone_id: string;
  route_name: string;
  status: 'assigned' | 'active' | 'completed';
  total_stops: number;
  completed_stops: number;
  scheduled_start_time: string;
}

export interface RouteBuilding {
  id: string;
  route_id: string;
  building_id: string; // Matches custom_id
  sequence: number;
  status: 'pending' | 'arrived' | 'completed' | 'skipped';
  skip_reason?: string;
  arrival_time?: string;
  completion_time?: string;
  // We will join this with the Buildings table to get address, coords, etc.
  address?: string;
  latitude?: number;
  longitude?: number;
  payment_status?: string;
  waste_type?: string;
  estimated_waste?: string;
  occupancy?: string;
}

export type TruckStatus = 'Moving' | 'Stopped' | 'Collecting' | 'Driving';
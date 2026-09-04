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
  building_id: string;
  sequence: number;
  status: 'pending' | 'arrived' | 'completed' | 'skipped';
  skip_reason?: string;
  arrival_time?: string;
  completion_time?: string;
  address?: string;
  estate?: string;
  building_type?: string;
  number_of_units?: number;
  unit_type?: string;
  latitude?: number;
  longitude?: number;
  payment_status?: string;
}

export type TruckStatus = 'Moving' | 'Stopped' | 'Collecting' | 'Driving';
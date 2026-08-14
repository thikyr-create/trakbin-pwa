import { createClient } from '@supabase/supabase-js';
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

export async function createRoute(args: {
  companyId: number;
  truckId: string;
  driverId: string;
  geometry: any;
  distanceKm: number;
  durationMin: number;
  totalStops: number;
  zoneName?: string | null;
  routeName?: string | null;
}) {
  const routeName =
    args.routeName ||
    `RT-${new Date().toISOString().slice(0, 10)}-${args.totalStops}stops`;

  const { data, error } = await supabase.from('routes').insert([{
    company_id: args.companyId,
    truck_id: args.truckId,
    driver_id: args.driverId,
    geometry: args.geometry,
    distance_km: args.distanceKm,
    duration_min: args.durationMin,
    optimized: true,
    total_stops: args.totalStops,
    completed_stops: 0,
    status: 'active',
    route_name: routeName,                 // NOT NULL — was missing, insert threw
    zone_id: args.zoneName || 'unassigned', // NOT NULL — was missing, insert threw
    algorithm: 'haversine_nearest_neighbour',
    matrix_source: 'client_haversine',
  }]).select().single();
  if (error) throw error;
  return data;
}
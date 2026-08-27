// mobile/services/routes.ts
import { supabase } from './supabase';

export interface Stop {
  id: string; building_id: string; sequence: number; status: string;
  skip_reason?: string | null; address?: string | null; estate?: string | null;
  latitude?: number | null; longitude?: number | null;
}

export async function fetchActiveRoute(companyId: number, driverRowId: number) {
  const { data } = await supabase
    .from('routes').select('*')
    .eq('company_id', companyId)
    .eq('driver_id', String(driverRowId))
    .in('status', ['assigned', 'active', 'paused'])
    .order('created_at', { ascending: false })
    .limit(1);
  return data?.[0] ?? null;
}

export async function fetchStops(companyId: number, routeId: string): Promise<Stop[]> {
  const { data: stops } = await supabase
    .from('route_stops').select('*')
    .eq('company_id', companyId).eq('route_id', routeId)
    .order('sequence', { ascending: true });
  if (!stops?.length) return [];
  const ids = stops.map((s: any) => s.building_id);
  const { data: buildings } = await supabase
    .from('Buildings').select('custom_id, address, estate, latitude, longitude')
    .eq('company_id', companyId).in('custom_id', ids);
  const map = new Map((buildings || []).map((b: any) => [b.custom_id, b]));
  return stops.map((s: any) => {
    const b = map.get(s.building_id);
    return {
      ...s,
      address: b?.address ?? null, estate: b?.estate ?? null,
      latitude: b?.latitude != null ? Number(b.latitude) : null,
      longitude: b?.longitude != null ? Number(b.longitude) : null,
    };
  });
}
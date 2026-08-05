// lib/features/zones/services/zoneService.ts
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export interface ZoneRecord {
  id: string;
  zone_name: string;
  center_lat: number | null;
  center_lng: number | null;
  radius_km: number | null;
  is_active: boolean | null;
  created_at: string;
  estates: string[] | null;
  streets: string[] | null;
  addresses: string[] | null;
  // Derived
  building_count: number;
  active_service_count: number;
}

export interface ZoneBuildingRow {
  custom_id: string;
  address: string | null;
  estate: string | null;
  status: string;
  payment_status: string;
  service_status: string | null;
  pickup_days: string[] | null;
  activated_at: string | null;
}

export interface ZoneStats {
  total: number;
  activeService: number;
  paid: number;
  unpaid: number;
  pickupDayCounts: Record<string, number>;
}

export interface ZoneDetail {
  zone: ZoneRecord;
  buildings: ZoneBuildingRow[];
  stats: ZoneStats;
}

export async function fetchZones(company_id: number): Promise<ZoneRecord[]> {
  const { data: zones, error } = await supabase
    .from('company_zones')
    .select('*')
    .eq('company_id', company_id)
    .order('created_at', { ascending: false });

  if (error || !zones) {
    console.error('Error fetching zones:', error);
    return [];
  }

  const { data: assignments } = await supabase
    .from('service_assignments')
    .select('zone_id, service_status')
    .eq('company_id', company_id);

  const countByName = new Map<string, { total: number; active: number }>();
  (assignments || []).forEach((a: any) => {
    if (!a.zone_id) return;
    const entry = countByName.get(a.zone_id) || { total: 0, active: 0 };
    entry.total += 1;
    if (a.service_status === 'active') entry.active += 1;
    countByName.set(a.zone_id, entry);
  });

  return zones.map((z: any) => {
    const counts = countByName.get(z.zone_name) || { total: 0, active: 0 };
    return {
      ...z,
      building_count: counts.total,
      active_service_count: counts.active,
    };
  });
}

export async function fetchZoneDetail(
  zone_id: string,
  company_id: number
): Promise<ZoneDetail | null> {
  const { data: zone } = await supabase
    .from('company_zones')
    .select('*')
    .eq('id', zone_id)
    .eq('company_id', company_id)
    .maybeSingle();

  if (!zone) return null;

  const { data: assignments } = await supabase
    .from('service_assignments')
    .select('building_id, service_status, pickup_days, activated_at')
    .eq('zone_id', zone.zone_name)
    .eq('company_id', company_id);

  const buildingIds = (assignments || [])
    .map((a: any) => a.building_id)
    .filter(Boolean);

  let buildingsMap = new Map<string, any>();
  if (buildingIds.length > 0) {
    const { data: buildings } = await supabase
      .from('Buildings')
      .select('custom_id, address, estate, status, payment_status')
      .in('custom_id', buildingIds);
    (buildings || []).forEach((b: any) => buildingsMap.set(b.custom_id, b));
  }

  const buildings: ZoneBuildingRow[] = (assignments || []).map((a: any) => {
    const b = buildingsMap.get(a.building_id) || {};
    return {
      custom_id: a.building_id,
      address: b.address || null,
      estate: b.estate || null,
      status: b.status || 'unknown',
      payment_status: b.payment_status || 'unknown',
      service_status: a.service_status || null,
      pickup_days: a.pickup_days || null,
      activated_at: a.activated_at || null,
    };
  });

  const pickupDayCounts: Record<string, number> = {};
  let paid = 0;
  let unpaid = 0;
  let activeService = 0;

  buildings.forEach((b) => {
    if (b.payment_status === 'paid') paid += 1;
    else if (b.payment_status === 'unpaid') unpaid += 1;
    if (b.service_status === 'active') activeService += 1;
    (b.pickup_days || []).forEach((d: string) => {
      pickupDayCounts[d] = (pickupDayCounts[d] || 0) + 1;
    });
  });

  const base: ZoneRecord = {
    ...zone,
    building_count: buildings.length,
    active_service_count: activeService,
  };

  return {
    zone: base,
    buildings,
    stats: {
      total: buildings.length,
      activeService,
      paid,
      unpaid,
      pickupDayCounts,
    },
  };
}

export async function createZone(
  company_id: number,
  payload: {
    zone_name: string;
    center_lat?: number | null;
    center_lng?: number | null;
    radius_km?: number | null;
    estates?: string[];
    streets?: string[];
    addresses?: string[];
  }
): Promise<{ ok: boolean; error?: string }> {
  const { error } = await supabase.from('company_zones').insert([
    {
      company_id,
      zone_name: payload.zone_name,
      center_lat: payload.center_lat ?? null,
      center_lng: payload.center_lng ?? null,
      radius_km: payload.radius_km ?? null,
      is_active: true,
      estates: payload.estates || [],
      streets: payload.streets || [],
      addresses: payload.addresses || [],
    },
  ]);

  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

/**
 * Updates only the SAFE fields of a zone.
 * zone_name is deliberately NOT editable here: under Option A it is the
 * join key to service_assignments.zone_id — renaming would orphan buildings.
 */
export async function updateZone(
  zone_id: string,
  payload: {
    center_lat?: number | null;
    center_lng?: number | null;
    radius_km?: number | null;
    is_active?: boolean;
    estates?: string[];
    streets?: string[];
    addresses?: string[];
  }
): Promise<{ ok: boolean; error?: string }> {
  const patch: Record<string, unknown> = {};

  if (payload.center_lat !== undefined) patch.center_lat = payload.center_lat;
  if (payload.center_lng !== undefined) patch.center_lng = payload.center_lng;
  if (payload.radius_km !== undefined) patch.radius_km = payload.radius_km;
  if (payload.is_active !== undefined) patch.is_active = payload.is_active;
  if (payload.estates !== undefined) patch.estates = payload.estates;
  if (payload.streets !== undefined) patch.streets = payload.streets;
  if (payload.addresses !== undefined) patch.addresses = payload.addresses;

  const { error } = await supabase
    .from('company_zones')
    .update(patch)
    .eq('id', zone_id);

  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function deleteZone(zone_id: string): Promise<{ ok: boolean; error?: string }> {
  const { error } = await supabase.from('company_zones').delete().eq('id', zone_id);
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function toggleZoneActive(
  zone_id: string,
  is_active: boolean
): Promise<{ ok: boolean; error?: string }> {
  const { error } = await supabase
    .from('company_zones')
    .update({ is_active })
    .eq('id', zone_id);
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}
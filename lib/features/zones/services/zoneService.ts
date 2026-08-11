// lib/features/zones/services/zoneService.ts
import { createClient } from '@supabase/supabase-js';
import {
  resolveBuildingZone,
  type ZoneResolution,
} from '../utils/zoneAssignment';
import { ZonePublisher, AssignmentPublisher } from '@/lib/core/event-bus';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export interface ZoneRecord {
  id: string;
  zone_name: string;
  center_lat: number | null;
  center_lng: number | null;
  radius_km: number | null;
  polygon: number[][] | null;
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
  latitude: number | null;
  longitude: number | null;
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

export interface UnassignedBuilding {
  custom_id: string;
  address: string | null;
  estate: string | null;
  latitude: number | null;
  longitude: number | null;
  has_assignment: boolean;
  resolution: ZoneResolution | null;
}

export interface AutoAssignResult {
  assigned: number;
  needsReview: UnassignedBuilding[];
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
      .select('custom_id, address, estate, status, payment_status, latitude, longitude')
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
      latitude: b.latitude ? Number(b.latitude) : null,
      longitude: b.longitude ? Number(b.longitude) : null,
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

/** Buildings with no service assignment, or an assignment missing a zone. */
export async function fetchUnassignedBuildings(
  company_id: number
): Promise<UnassignedBuilding[]> {
  const [{ data: buildings }, { data: assignments }] = await Promise.all([
    supabase
      .from('Buildings')
      .select('custom_id, address, estate, latitude, longitude')
      .eq('company_id', company_id),
    supabase
      .from('service_assignments')
      .select('building_id, zone_id')
      .eq('company_id', company_id),
  ]);

  const zoneByBuilding = new Map<string, string | null>();
  (assignments || []).forEach((a: any) => {
    zoneByBuilding.set(a.building_id, a.zone_id || null);
  });

  return (buildings || [])
    .filter((b: any) => !zoneByBuilding.get(b.custom_id))
    .map((b: any) => ({
      custom_id: b.custom_id,
      address: b.address || null,
      estate: b.estate || null,
      latitude: b.latitude != null ? Number(b.latitude) : null,
      longitude: b.longitude != null ? Number(b.longitude) : null,
      has_assignment: zoneByBuilding.has(b.custom_id),
      resolution: null,
    }));
}

/**
 * Bulk auto-assignment.
 * High + medium confidence → written to service_assignments.
 * Low confidence + unmatched → returned for manual review (never auto-applied).
 */
export async function autoAssignZones(company_id: number): Promise<AutoAssignResult> {
  const zones = await fetchZones(company_id);
  const unassigned = await fetchUnassignedBuildings(company_id);

  const toWrite: Array<{ b: UnassignedBuilding; res: ZoneResolution }> = [];
  const needsReview: UnassignedBuilding[] = [];

  for (const b of unassigned) {
    const res = resolveBuildingZone(b, zones);
    if (res && (res.confidence === 'high' || res.confidence === 'medium')) {
      toWrite.push({ b, res });
    } else {
      needsReview.push({ ...b, resolution: res });
    }
  }

  // New assignment rows in one batch
  const inserts = toWrite
    .filter(({ b }) => !b.has_assignment)
    .map(({ b, res }) => ({
      id: crypto.randomUUID(),
      building_id: b.custom_id,
      company_id,
      zone_id: res.zone_name,
      service_status: 'pending',
      activated_at: new Date().toISOString(),
    }));

  if (inserts.length > 0) {
    await supabase.from('service_assignments').insert(inserts);
  }

  // Existing rows get their zone filled in
  const updates = toWrite.filter(({ b }) => b.has_assignment);
  for (const { b, res } of updates) {
    await supabase
      .from('service_assignments')
      .update({ zone_id: res.zone_name })
      .eq('building_id', b.custom_id)
      .eq('company_id', company_id);
  }

  AssignmentPublisher.publish('ASSIGNMENT_UPDATED', { companyId: company_id });
  return { assigned: toWrite.length, needsReview };
}

/** Manual assignment — used by the needs-review flow. */
export async function assignBuildingToZone(
  company_id: number,
  building_id: string,
  zone_name: string,
  has_assignment: boolean
): Promise<{ ok: boolean; error?: string }> {
  if (has_assignment) {
    const { error } = await supabase
      .from('service_assignments')
      .update({ zone_id: zone_name })
      .eq('building_id', building_id)
      .eq('company_id', company_id);
    if (error) return { ok: false, error: error.message };
    AssignmentPublisher.publish('ASSIGNMENT_UPDATED', { buildingId: building_id, companyId: company_id });
    return { ok: true };
  }

  const { error } = await supabase.from('service_assignments').insert([
    {
      id: crypto.randomUUID(),
      building_id,
      company_id,
      zone_id: zone_name,
      service_status: 'pending',
      activated_at: new Date().toISOString(),
    },
  ]);
  if (error) return { ok: false, error: error.message };
  AssignmentPublisher.publish('ASSIGNMENT_UPDATED', { buildingId: building_id, companyId: company_id });
  return { ok: true };
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
): Promise<{ ok: boolean; error?: string; duplicate?: { zoneId: string; zoneName: string } }> {
  // Normalize: trim on both check AND insert so "Zone 12 " and "Zone 12" collide
  const trimmedName = payload.zone_name.trim();
  if (!trimmedName) return { ok: false, error: 'zone_name_required' };

  const { data: existing } = await supabase
    .from('company_zones')
    .select('id, zone_name')
    .eq('company_id', company_id)
    .ilike('zone_name', trimmedName)
    .maybeSingle();

  if (existing) {
    return {
      ok: false,
      error: 'zone_name_exists',
      duplicate: { zoneId: existing.id, zoneName: existing.zone_name },
    };
  }

  const { error } = await supabase.from('company_zones').insert([
    {
      company_id,
      zone_name: trimmedName,
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
  ZonePublisher.publish('ZONE_CREATED', { companyId: company_id });
  return { ok: true };
}

/**
 * Updates only the SAFE fields of a zone.
 * zone_name is deliberately NOT editable: it is the join key to
 * service_assignments.zone_id — renaming would orphan buildings.
 */
export async function updateZone(
  zone_id: string,
  payload: {
    center_lat?: number | null;
    center_lng?: number | null;
    radius_km?: number | null;
    polygon?: number[][] | null;
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
  if (payload.polygon !== undefined) patch.polygon = payload.polygon;
  if (payload.is_active !== undefined) patch.is_active = payload.is_active;
  if (payload.estates !== undefined) patch.estates = payload.estates;
  if (payload.streets !== undefined) patch.streets = payload.streets;
  if (payload.addresses !== undefined) patch.addresses = payload.addresses;

  const { error } = await supabase
    .from('company_zones')
    .update(patch)
    .eq('id', zone_id);

  if (error) return { ok: false, error: error.message };
  ZonePublisher.publish('ZONE_UPDATED', { zoneId: zone_id });
  return { ok: true };
}

export async function deleteZone(zone_id: string): Promise<{ ok: boolean; error?: string }> {
  const { error } = await supabase.from('company_zones').delete().eq('id', zone_id);
  if (error) return { ok: false, error: error.message };
  ZonePublisher.publish('ZONE_DELETED', { zoneId: zone_id });
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
  ZonePublisher.publish('ZONE_UPDATED', { zoneId: zone_id });
  return { ok: true };
}

/** Auto-assignment flag — defaults ON when no settings row exists. */
export async function fetchAutoAssignFlag(company_id: number): Promise<boolean> {
  const { data } = await supabase
    .from('company_settings')
    .select('auto_zone_assignment')
    .eq('company_id', company_id)
    .maybeSingle();

  return data?.auto_zone_assignment !== false;
}

export async function setAutoAssignFlag(
  company_id: number,
  enabled: boolean
): Promise<{ ok: boolean; error?: string }> {
  const { data } = await supabase
    .from('company_settings')
    .update({ auto_zone_assignment: enabled })
    .eq('company_id', company_id)
    .select('id');

  if (!data || data.length === 0) {
    await supabase
      .from('company_settings')
      .insert([{ company_id, auto_zone_assignment: enabled }]);
  }
  return { ok: true };
}

/**
 * Merge new coverage details into an existing zone (union, never overwrite).
 * Optional: caller can also rename the zone — cascades to service_assignments.zone_id.
 */
export async function mergeIntoZone(
  zone_id: string,
  payload: {
    zone_name?: string;
    center_lat?: number | null;
    center_lng?: number | null;
    radius_km?: number | null;
    estates?: string[];
    streets?: string[];
    addresses?: string[];
  }
): Promise<{ ok: boolean; error?: string }> {
  const { data: zone } = await supabase
    .from('company_zones')
    .select('*')
    .eq('id', zone_id)
    .maybeSingle();

  if (!zone) return { ok: false, error: 'zone_not_found' };

  const union = (a: string[] | null, b: string[] | undefined) =>
    Array.from(new Set([...(a || []), ...(b || [])]));

  const patch: Record<string, unknown> = {
    estates: union(zone.estates, payload.estates),
    streets: union(zone.streets, payload.streets),
    addresses: union(zone.addresses, payload.addresses),
  };
  if (payload.center_lat != null) patch.center_lat = payload.center_lat;
  if (payload.center_lng != null) patch.center_lng = payload.center_lng;
  if (payload.radius_km != null) patch.radius_km = payload.radius_km;

  // Rename support: cascade to service_assignments.zone_id (which stores the name string)
  if (payload.zone_name && payload.zone_name.trim() && payload.zone_name.trim() !== zone.zone_name) {
    const newName = payload.zone_name.trim();
    // Collision check
    const { data: collision } = await supabase
      .from('company_zones')
      .select('id')
      .eq('company_id', zone.company_id)
      .ilike('zone_name', newName)
      .maybeSingle();
    if (collision) return { ok: false, error: 'zone_name_exists' };

    const { error: assignErr } = await supabase
      .from('service_assignments')
      .update({ zone_id: newName })
      .eq('zone_id', zone.zone_name)
      .eq('company_id', zone.company_id);
    if (assignErr) return { ok: false, error: 'Could not re-point assignments: ' + assignErr.message };
    patch.zone_name = newName;
  }

  const { error } = await supabase.from('company_zones').update(patch).eq('id', zone_id);
  if (error) return { ok: false, error: error.message };
  ZonePublisher.publish('ZONE_UPDATED', { zoneId: zone_id });
  return { ok: true };
}
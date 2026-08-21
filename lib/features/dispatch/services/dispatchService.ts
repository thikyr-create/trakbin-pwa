// lib/features/dispatch/services/dispatchService.ts
import { supabaseBrowser } from '@/lib/supabaseBrowser';
import { optimizeRoute, type OptimizationStop } from '@/lib/core/route-optimization';
import { optimizeDispatch, enrichDriverContext, type ScoredResource } from '../utils/dispatchOptimizer';
import { RoutePublisher } from '@/lib/core/event-bus';

const supabase = supabaseBrowser;

export interface DispatchPreview {
  targetDate: string;
  dayName: string;
  totalBuildings: number;
  zones: Array<{
    zone_name: string;
    buildingCount: number;
    requiredRoutes: number;
  }>;
  availableDrivers: number;
  availableTrucks: number;
  canExecute: boolean;
  blockReason?: string;
}

export interface DispatchResult {
  routesCreated: number;
  stopsMaterialized: number;
  unassignedRoutes: number;
  matrixSource: 'mapbox' | 'haversine';
}

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

function getTargetDateInfo(date: Date) {
  const iso = date.toISOString().slice(0, 10);
  const dayName = DAY_NAMES[date.getDay()];
  return { iso, dayName };
}

// Legacy stop shape (still used by zoneGroups Map construction)
interface Stop { building_id: string; lat: number; lng: number; }

// Map legacy shape → new OptimizationStop shape
function toOptimizationStops(stops: Stop[]): OptimizationStop[] {
  return stops.map((s) => ({
    buildingId: s.building_id,
    latitude: s.lat,
    longitude: s.lng,
  }));
}

export async function previewDispatch(
  company_id: number,
  targetDate: Date
): Promise<DispatchPreview> {
  const { iso, dayName } = getTargetDateInfo(targetDate);

  const { data: settings } = await supabase
    .from('company_settings')
    .select('max_stops_per_route, auto_assign_drivers')
    .eq('company_id', company_id)
    .maybeSingle();

  const maxStops = settings?.max_stops_per_route ?? 60;

  const { data: assignments } = await supabase
    .from('service_assignments')
    .select('zone_id, building_id, pickup_days')
    .eq('company_id', company_id)
    .contains('pickup_days', [dayName]);

  const scheduledBuildingIds = (assignments || [])
    .filter((a: any) => a.pickup_days && a.pickup_days.includes(dayName))
    .map((a: any) => ({ building_id: a.building_id, zone_id: a.zone_id }));

  if (scheduledBuildingIds.length === 0) {
    return {
      targetDate: iso, dayName, totalBuildings: 0, zones: [],
      availableDrivers: 0, availableTrucks: 0, canExecute: false,
      blockReason: 'No buildings scheduled for this day.',
    };
  }

  const uniqueIds = [...new Set(scheduledBuildingIds.map((s: any) => s.building_id))];
  const { data: buildings } = await supabase
    .from('Buildings')
    .select('custom_id, status, payment_status, latitude, longitude')
    .eq('company_id', company_id)
    .in('custom_id', uniqueIds)
    .eq('status', 'active');

  const validBuildings = (buildings || []).filter(
    (b: any) => b.payment_status !== 'suspended' &&
      b.latitude != null && b.longitude != null &&
      !(b.latitude === 0 && b.longitude === 0)
  );

  const validIds = new Set(validBuildings.map((b: any) => b.custom_id));

  const zoneMap = new Map<string, number>();
  scheduledBuildingIds.forEach((s: any) => {
    if (validIds.has(s.building_id)) {
      zoneMap.set(s.zone_id, (zoneMap.get(s.zone_id) || 0) + 1);
    }
  });

  const zones = Array.from(zoneMap.entries()).map(([zone_name, count]) => ({
    zone_name, buildingCount: count, requiredRoutes: Math.ceil(count / maxStops),
  }));

  const totalRequiredRoutes = zones.reduce((sum, z) => sum + z.requiredRoutes, 0);

  const [{ count: driverCount }, { count: truckCount }] = await Promise.all([
    supabase.from('drivers').select('*', { count: 'exact', head: true })
      .eq('company_id', company_id).eq('status', 'available'),
    supabase.from('trucks').select('*', { count: 'exact', head: true })
      .eq('company_id', company_id).eq('status', 'available'),
  ]);

  const availDrivers = driverCount || 0;
  const availTrucks = truckCount || 0;
  const canExecute = availDrivers >= totalRequiredRoutes && availTrucks >= totalRequiredRoutes;
  const blockReason = !canExecute
    ? `Need ${totalRequiredRoutes} drivers/trucks, but only ${availDrivers} drivers and ${availTrucks} trucks are available.`
    : undefined;

  return {
    targetDate: iso, dayName, totalBuildings: validBuildings.length,
    zones, availableDrivers: availDrivers, availableTrucks: availTrucks,
    canExecute, blockReason,
  };
}

export async function executeDispatch(
  company_id: number,
  targetDate: Date
): Promise<DispatchResult> {
  const { iso, dayName } = getTargetDateInfo(targetDate);
  const result: DispatchResult = { routesCreated: 0, stopsMaterialized: 0, unassignedRoutes: 0, matrixSource: 'haversine' };

  // Idempotency check
  const startOfDay = `${iso}T00:00:00.000Z`;
  const endOfDay = `${iso}T23:59:59.999Z`;
  const { count: existingRoutes } = await supabase
    .from('routes')
    .select('*', { count: 'exact', head: true })
    .eq('company_id', company_id)
    .gte('scheduled_start_time', startOfDay)
    .lte('scheduled_start_time', endOfDay);

  if ((existingRoutes || 0) > 0) {
    throw new Error(`Routes already exist for ${dayName}, ${iso}. Cancel them first or choose another date.`);
  }

  const { data: settings } = await supabase
    .from('company_settings')
    .select('max_stops_per_route, auto_assign_drivers, working_hours_start')
    .eq('company_id', company_id)
    .maybeSingle();

  const maxStops = settings?.max_stops_per_route ?? 60;
  const autoAssign = settings?.auto_assign_drivers ?? false;
  const startTime = settings?.working_hours_start ?? '07:00';
  const scheduledStart = `${iso}T${startTime}:00.000Z`;

  const { data: assignments } = await supabase
    .from('service_assignments')
    .select('zone_id, building_id, pickup_days')
    .eq('company_id', company_id)
    .contains('pickup_days', [dayName]);

  const scheduled = (assignments || []).filter(
    (a: any) => a.pickup_days && a.pickup_days.includes(dayName)
  );

  if (scheduled.length === 0) return result;

  const uniqueIds = [...new Set(scheduled.map((s: any) => s.building_id))];
  const { data: buildings } = await supabase
    .from('Buildings')
    .select('custom_id, status, payment_status, latitude, longitude')
    .eq('company_id', company_id)
    .in('custom_id', uniqueIds)
    .eq('status', 'active');

  const buildingMap = new Map(
    (buildings || [])
      .filter((b: any) => b.payment_status !== 'suspended' && b.latitude != null && b.longitude != null)
      .map((b: any) => [b.custom_id, b])
  );

  const zoneGroups = new Map<string, Stop[]>();
  scheduled.forEach((s: any) => {
    const b = buildingMap.get(s.building_id);
    if (b) {
      if (!zoneGroups.has(s.zone_id)) zoneGroups.set(s.zone_id, []);
      zoneGroups.get(s.zone_id)!.push({
        building_id: b.custom_id, lat: Number(b.latitude), lng: Number(b.longitude),
      });
    }
  });

  const [{ data: drivers }, { data: trucks }] = await Promise.all([
    supabase.from('drivers').select('*').eq('company_id', company_id).eq('status', 'available'),
    supabase.from('trucks').select('*').eq('company_id', company_id).eq('status', 'available'),
  ]);

  const driverPool = [...(drivers || [])];
  const truckPool = [...(trucks || [])];

  for (const [zoneName, stops] of zoneGroups.entries()) {
    const enrichedDrivers = await enrichDriverContext(company_id, driverPool, zoneName, iso);

    // ── NEW: delegate stop ordering to the core route-optimization engine ──
    // The core handles sub-chunking via maxStopsPerRoute and returns road-network
    // distances/times when MAPBOX_TOKEN is present.
    const optimizationResult = await optimizeRoute({
      stops: toOptimizationStops(stops),
      constraints: { maxStopsPerRoute: maxStops, averageSpeedKmh: 25 },
    });

    // Track which routing provider was used (for transparency in preview)
    result.matrixSource = optimizationResult.matrixSource;

    // The core returns one OptimizedRoute per chunk
    for (const [chunkIdx, chunkRoute] of optimizationResult.routes.entries()) {
      const orderedStops = chunkRoute.orderedStops;
      const distanceKm = chunkRoute.metrics.totalDistanceKm;
      const durationMin = chunkRoute.metrics.estimatedDurationMin;

      // Resource matching: which driver/truck should take this route?
      const scoredResources = optimizeDispatch(enrichedDrivers, truckPool, {
        zone_name: zoneName, required_stops: orderedStops.length, target_date: iso,
      });

      const bestMatch: ScoredResource | null = autoAssign && scoredResources.length > 0
        ? scoredResources[0] : null;

      const driver = bestMatch?.driver || null;
      const truck = bestMatch?.truck || null;
      const driverId = driver ? (driver.employee_id || driver.id) : '__unassigned__';
      const truckId = truck ? String(truck.id) : '__unassigned__';

      // Geometry stored as stop-points (parity with existing schema)
      const geometry = orderedStops.map((s, idx) => ({
        stop: idx + 1, building_id: s.buildingId, lat: s.latitude, lng: s.longitude,
      }));

      const { data: route, error: routeErr } = await supabase
        .from('routes')
        .insert([{
          company_id,
          zone_id: zoneName,
          route_name: `${zoneName} - ${dayName} ${chunkIdx + 1}`,
          driver_id: driverId,
          truck_id: truckId,
          geometry,
          distance_km: distanceKm,
          duration_min: durationMin,
          total_stops: orderedStops.length,
          completed_stops: 0,
          status: driver && truck ? 'assigned' : 'unassigned',
          optimized: true,
          scheduled_start_time: scheduledStart,
          algorithm: chunkRoute.algorithm,
          matrix_source: chunkRoute.matrixSource,
        }])
        .select('id')
        .single();

      if (routeErr || !route) continue;

      result.routesCreated += 1;
      if (!driver || !truck) result.unassignedRoutes += 1;

      const stopInserts = orderedStops.map((s, idx) => ({
        route_id: route.id, building_id: s.buildingId,
        sequence: idx + 1, status: 'pending', company_id,
      }));

      const { error: stopsErr } = await supabase.from('route_stops').insert(stopInserts);
      if (!stopsErr) result.stopsMaterialized += orderedStops.length;

      if (driver) {
        await supabase.from('drivers').update({ status: 'busy' }).eq('id', driver.id);
        const idx = driverPool.findIndex((d) => d.id === driver.id);
        if (idx >= 0) driverPool.splice(idx, 1);
      }
      if (truck) {
        await supabase.from('trucks').update({ status: 'assigned', current_driver: driver?.full_name || null }).eq('id', truck.id);
        const idx = truckPool.findIndex((t) => t.id === truck.id);
        if (idx >= 0) truckPool.splice(idx, 1);
      }

      // EVENT BUS: downstream engines (analytics, notifications, driver app) react
      RoutePublisher.publish('ROUTE_GENERATED', { routeId: String(route.id), companyId: company_id });
    }
  }

  return result;
}
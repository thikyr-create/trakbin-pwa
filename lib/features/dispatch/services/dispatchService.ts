// lib/features/dispatch/services/dispatchService.ts
import { createClient } from '@supabase/supabase-js';
import { optimizeStops, estimateDurationMin, type Stop } from '@/lib/core/assignment/RouteOptimizer';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

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
  unassignedRoutes: number; // Routes created but no driver/truck available
}

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

function getTargetDateInfo(date: Date) {
  const iso = date.toISOString().slice(0, 10);
  const dayName = DAY_NAMES[date.getDay()];
  return { iso, dayName };
}

/**
 * Previews the dispatch plan for a specific date without writing to the database.
 */
export async function previewDispatch(
  company_id: number,
  targetDate: Date
): Promise<DispatchPreview> {
  const { iso, dayName } = getTargetDateInfo(targetDate);

  // 1. Fetch settings for capacity limits
  const { data: settings } = await supabase
    .from('company_settings')
    .select('max_stops_per_route, auto_assign_drivers')
    .eq('company_id', company_id)
    .maybeSingle();

  const maxStops = settings?.max_stops_per_route ?? 60;

  // 2. Fetch scheduled demand for this day
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
      targetDate: iso,
      dayName,
      totalBuildings: 0,
      zones: [],
      availableDrivers: 0,
      availableTrucks: 0,
      canExecute: false,
      blockReason: 'No buildings scheduled for this day.',
    };
  }

  // 3. Filter to active, paid buildings with GPS
  const uniqueIds = [...new Set(scheduledBuildingIds.map((s: any) => s.building_id))];
  const { data: buildings } = await supabase
    .from('Buildings')
    .select('custom_id, status, payment_status, latitude, longitude')
    .eq('company_id', company_id)
    .in('custom_id', uniqueIds)
    .eq('status', 'active');

  const validBuildings = (buildings || []).filter(
    (b: any) =>
      b.payment_status !== 'suspended' &&
      b.latitude != null &&
      b.longitude != null &&
      !(b.latitude === 0 && b.longitude === 0)
  );

  const validIds = new Set(validBuildings.map((b: any) => b.custom_id));

  // 4. Group by zone and calculate route chunks
  const zoneMap = new Map<string, number>();
  scheduledBuildingIds.forEach((s: any) => {
    if (validIds.has(s.building_id)) {
      zoneMap.set(s.zone_id, (zoneMap.get(s.zone_id) || 0) + 1);
    }
  });

  const zones = Array.from(zoneMap.entries()).map(([zone_name, count]) => ({
    zone_name,
    buildingCount: count,
    requiredRoutes: Math.ceil(count / maxStops),
  }));

  const totalRequiredRoutes = zones.reduce((sum, z) => sum + z.requiredRoutes, 0);

  // 5. Check resource availability
  const [{ count: driverCount }, { count: truckCount }] = await Promise.all([
    supabase
      .from('drivers')
      .select('*', { count: 'exact', head: true })
      .eq('company_id', company_id)
      .eq('status', 'available'),
    supabase
      .from('trucks')
      .select('*', { count: 'exact', head: true })
      .eq('company_id', company_id)
      .eq('status', 'available'),
  ]);

  const availDrivers = driverCount || 0;
  const availTrucks = truckCount || 0;

  const canExecute = availDrivers >= totalRequiredRoutes && availTrucks >= totalRequiredRoutes;
  const blockReason = !canExecute
    ? `Need ${totalRequiredRoutes} drivers/trucks, but only ${availDrivers} drivers and ${availTrucks} trucks are available.`
    : undefined;

  return {
    targetDate: iso,
    dayName,
    totalBuildings: validBuildings.length,
    zones,
    availableDrivers: availDrivers,
    availableTrucks: availTrucks,
    canExecute,
    blockReason,
  };
}

/**
 * Materializes the dispatch plan.
 * Creates `routes` and `route_stops`. Assigns drivers/trucks if available and auto-assign is ON.
 */
export async function executeDispatch(
  company_id: number,
  targetDate: Date
): Promise<DispatchResult> {
  const { iso, dayName } = getTargetDateInfo(targetDate);
  const result: DispatchResult = { routesCreated: 0, stopsMaterialized: 0, unassignedRoutes: 0 };

  // Idempotency check: abort if routes already exist for this date
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

  // Fetch settings
  const { data: settings } = await supabase
    .from('company_settings')
    .select('max_stops_per_route, auto_assign_drivers, working_hours_start')
    .eq('company_id', company_id)
    .maybeSingle();

  const maxStops = settings?.max_stops_per_route ?? 60;
  const autoAssign = settings?.auto_assign_drivers ?? false;
  const startTime = settings?.working_hours_start ?? '07:00';
  const scheduledStart = `${iso}T${startTime}:00.000Z`;

  // Fetch demand
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
      .filter(
        (b: any) =>
          b.payment_status !== 'suspended' &&
          b.latitude != null &&
          b.longitude != null
      )
      .map((b: any) => [b.custom_id, b])
  );

  // Group by zone
  const zoneGroups = new Map<string, Stop[]>();
  scheduled.forEach((s: any) => {
    const b = buildingMap.get(s.building_id);
    if (b) {
      if (!zoneGroups.has(s.zone_id)) zoneGroups.set(s.zone_id, []);
      zoneGroups.get(s.zone_id)!.push({
        building_id: b.custom_id,
        lat: Number(b.latitude),
        lng: Number(b.longitude),
      });
    }
  });

  // Fetch available resources
  const [{ data: drivers }, { data: trucks }] = await Promise.all([
    supabase.from('drivers').select('id, full_name').eq('company_id', company_id).eq('status', 'available'),
    supabase.from('trucks').select('id, truck_id').eq('company_id', company_id).eq('status', 'available'),
  ]);

  const driverPool = [...(drivers || [])];
  const truckPool = [...(trucks || [])];

  // Materialize routes
  for (const [zoneName, stops] of zoneGroups.entries()) {
    // Chunk by max capacity
    for (let i = 0; i < stops.length; i += maxStops) {
      const chunk = stops.slice(i, i + maxStops);
      const { ordered, distanceKm } = optimizeStops(chunk);
      const durationMin = estimateDurationMin(distanceKm, ordered.length);

      // Allocate resources
      const driver = autoAssign ? driverPool.shift() : null;
      const truck = autoAssign ? truckPool.shift() : null;

      const geometry = ordered.map((s, idx) => ({
        stop: idx + 1,
        building_id: s.building_id,
        lat: s.lat,
        lng: s.lng,
      }));

      // Create Route
      const { data: route, error: routeErr } = await supabase
        .from('routes')
        .insert([{
          company_id,
          zone_id: zoneName,
          route_name: `${zoneName} - ${dayName} ${i / maxStops + 1}`,
          driver_id: driver ? String(driver.id) : null,
          truck_id: truck ? String(truck.id) : null,
          geometry,
          distance_km: distanceKm,
          duration_min: durationMin,
          total_stops: ordered.length,
          completed_stops: 0,
          status: driver && truck ? 'assigned' : 'unassigned',
          optimized: true,
          scheduled_start_time: scheduledStart,
        }])
        .select('id')
        .single();

      if (routeErr || !route) continue;

      result.routesCreated += 1;
      if (!driver || !truck) result.unassignedRoutes += 1;

      // Create Stops
      const stopInserts = ordered.map((s, idx) => ({
        route_id: route.id,
        building_id: s.building_id,
        sequence: idx + 1,
        status: 'pending',
        company_id,
      }));

      const { error: stopsErr } = await supabase.from('route_stops').insert(stopInserts);
      if (!stopsErr) {
        result.stopsMaterialized += ordered.length;
      }

      // Update resource status if assigned
      if (driver) {
        await supabase.from('drivers').update({ status: 'busy' }).eq('id', driver.id);
      }
      if (truck) {
        await supabase.from('trucks').update({ status: 'assigned', current_driver: driver?.full_name || null }).eq('id', truck.id);
      }
    }
  }

  return result;
}
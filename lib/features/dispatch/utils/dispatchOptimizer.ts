// lib/features/dispatch/utils/dispatchOptimizer.ts

export interface DriverCandidate {
  id: string;
  employee_id: string | null;
  full_name: string;
  status: string;
  current_assignment_id: string | null;
  assigned_truck_id: string | null;
  // Zone familiarity (count of routes completed in this zone in the last 30 days)
  zone_familiarity: number;
  // Current workload (active routes assigned today)
  workload: number;
  // Remaining working hours (simplified: 8 - hours worked today)
  remaining_hours: number;
}

export interface TruckCandidate {
  id: string;
  truck_id: string;
  status: string;
  capacity: string | null;
  zone: string | null;
  current_driver: string | null;
}

export interface DispatchContext {
  zone_name: string;
  required_stops: number;
  target_date: string;
}

export interface ScoredResource {
  driver: DriverCandidate;
  truck: TruckCandidate;
  score: number;
  breakdown: {
    workload: number;
    familiarity: number;
    capacity: number;
    availability: number;
  };
}

/**
 * Dispatch Optimizer v1.1.0
 * 
 * Scores driver-truck pairs using weighted criteria:
 * - Workload (30%): Lower is better. Drivers with fewer active routes get priority.
 * - Zone familiarity (25%): Higher is better. Drivers who know the zone perform better.
 * - Truck capacity (20%): Closer match to required stops is better (avoid oversized trucks).
 * - Availability (25%): Drivers without current assignments get a boost.
 * 
 * Future: Add driver performance metrics (on-time %, skip rate, customer feedback).
 */
export function optimizeDispatch(
  drivers: DriverCandidate[],
  trucks: TruckCandidate[],
  context: DispatchContext
): ScoredResource[] {
  const scored: ScoredResource[] = [];

  // Filter to available resources
  const availableDrivers = drivers.filter((d) => d.status === 'available');
  const availableTrucks = trucks.filter((t) => t.status === 'available');

  if (availableDrivers.length === 0 || availableTrucks.length === 0) {
    return [];
  }

  // Score each driver-truck pair
  for (const driver of availableDrivers) {
    for (const truck of availableTrucks) {
      // Skip if truck already has a different driver
      if (truck.current_driver && truck.current_driver !== driver.full_name) {
        continue;
      }

      // Workload score (0-100): 0 active routes = 100, 3+ routes = 0
      const workloadScore = Math.max(0, 100 - driver.workload * 33);

      // Familiarity score (0-100): 0 routes = 0, 5+ routes = 100
      const familiarityScore = Math.min(100, driver.zone_familiarity * 20);

      // Capacity score (0-100): Parse truck capacity and compare to required stops
      let capacityScore = 50; // Default if capacity unknown
      if (truck.capacity) {
        const capacityMatch = truck.capacity.match(/(\d+)/);
        if (capacityMatch) {
          const truckCapacity = parseInt(capacityMatch[1]);
          // Perfect match = 100, oversized by 2x = 50, oversized by 3x+ = 0
          const ratio = truckCapacity / context.required_stops;
          if (ratio >= 0.8 && ratio <= 1.5) capacityScore = 100;
          else if (ratio > 1.5 && ratio <= 2.5) capacityScore = 70;
          else if (ratio > 2.5) capacityScore = 30;
          else capacityScore = 50; // Undersized
        }
      }

      // Availability score (0-100): No current assignment = 100, has assignment = 30
      const availabilityScore = driver.current_assignment_id ? 30 : 100;

      // Weighted total
      const score =
        workloadScore * 0.30 +
        familiarityScore * 0.25 +
        capacityScore * 0.20 +
        availabilityScore * 0.25;

      scored.push({
        driver,
        truck,
        score: Math.round(score * 100) / 100,
        breakdown: {
          workload: Math.round(workloadScore),
          familiarity: Math.round(familiarityScore),
          capacity: Math.round(capacityScore),
          availability: Math.round(availabilityScore),
        },
      });
    }
  }

  // Sort by score descending
  scored.sort((a, b) => b.score - a.score);

  return scored;
}

/**
 * Fetches driver context for scoring (workload, familiarity, remaining hours).
 */
export async function enrichDriverContext(
  company_id: number,
  drivers: any[],
  zone_name: string,
  target_date: string
): Promise<DriverCandidate[]> {
  const supabase = (await import('@supabase/supabase-js')).createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const enriched: DriverCandidate[] = [];

  for (const d of drivers) {
    // Workload: count routes assigned to this driver on target_date
    const startOfDay = `${target_date}T00:00:00.000Z`;
    const endOfDay = `${target_date}T23:59:59.999Z`;
    const { count: workload } = await supabase
      .from('routes')
      .select('*', { count: 'exact', head: true })
      .eq('company_id', company_id)
      .eq('driver_id', d.employee_id || String(d.id))
      .gte('scheduled_start_time', startOfDay)
      .lte('scheduled_start_time', endOfDay)
      .in('status', ['assigned', 'active', 'paused']);

    // Zone familiarity: count completed routes in this zone in the last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const { count: familiarity } = await supabase
      .from('routes')
      .select('*', { count: 'exact', head: true })
      .eq('company_id', company_id)
      .eq('driver_id', d.employee_id || String(d.id))
      .eq('zone_id', zone_name)
      .eq('status', 'completed')
      .gte('created_at', thirtyDaysAgo.toISOString());

    // Remaining hours (simplified: assume 8-hour shift, deduct based on created_at of active routes)
    // For MVP, just use a static 8 hours. Future: calculate from shift start time.
    const remaining_hours = 8;

    enriched.push({
      id: String(d.id),
      employee_id: d.employee_id || null,
      full_name: d.full_name,
      status: d.status,
      current_assignment_id: d.current_assignment_id,
      assigned_truck_id: d.assigned_truck_id,
      zone_familiarity: familiarity || 0,
      workload: workload || 0,
      remaining_hours,
    });
  }

  return enriched;
}
import { createClient } from '@supabase/supabase-js';
import { optimizeStops, estimateDurationMin, type Stop } from './RouteOptimizer';
import { validateAssignment } from './AssignmentValidator';
import { createRoute } from './RouteEngine';
import { emit } from './AssignmentEvents';
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

export const AssignmentEngine = {
  async assign(args: { companyId: number; driver: any; truck: any; stops: Stop[]; assignedBy: string }) {
    const v = validateAssignment(args);
    if (!v.ok) return { ok: false, errors: v.errors };
    const { ordered, distanceKm } = optimizeStops(args.stops);
    const durationMin = estimateDurationMin(distanceKm, ordered.length);
    const route = await createRoute({
      companyId: args.companyId, truckId: args.truck.id, driverId: args.driver.id,
      geometry: ordered.map((s, i) => ({ stop: i + 1, building_id: s.building_id, lat: s.lat, lng: s.lng })),
      distanceKm, durationMin, totalStops: ordered.length,
    });
    const { data: assignment, error } = await supabase.from('assignments').insert([{
      company_id: args.companyId, driver_id: args.driver.id, truck_id: args.truck.id, route_id: route.id,
      status: 'assigned', assigned_by: args.assignedBy,
    }]).select().single();
    if (error) throw error;
    await supabase.from('assignment_buildings').insert(ordered.map((s, i) => ({ assignment_id: assignment.id, building_id: s.building_id, stop_order: i + 1 })));
    await supabase.from('trucks').update({ status: 'assigned', current_driver: args.driver.full_name }).eq('id', args.truck.id);
    await supabase.from('drivers').update({ status: 'busy', current_assignment_id: assignment.id }).eq('id', args.driver.id);
    await emit(args.companyId, assignment.id, 'route_assigned', `Route assigned to ${args.driver.full_name} (${args.truck.truck_id}) · ${ordered.length} stops`);
    return { ok: true, assignment };
  },

  async reassignTruck(assignmentId: string, newTruck: any) {
    const { data: a } = await supabase.from('assignments').select('*').eq('id', assignmentId).maybeSingle();
    if (!a) return { ok: false, errors: ['Assignment not found'] };
    await supabase.from('trucks').update({ status: 'available', current_driver: null }).eq('id', a.truck_id);
    await supabase.from('assignments').update({ truck_id: newTruck.id }).eq('id', assignmentId);
    await supabase.from('routes').update({ truck_id: newTruck.id }).eq('id', a.route_id);
    const { data: d } = await supabase.from('drivers').select('full_name').eq('id', a.driver_id).maybeSingle();
    await supabase.from('trucks').update({ status: 'assigned', current_driver: d?.full_name || null }).eq('id', newTruck.id);
    await emit(a.company_id, assignmentId, 'truck_reassigned', `Truck reassigned to ${newTruck.truck_id}`);
    return { ok: true };
  },

  async reassignDriver(assignmentId: string, newDriver: any) {
    const { data: a } = await supabase.from('assignments').select('*').eq('id', assignmentId).maybeSingle();
    if (!a) return { ok: false, errors: ['Assignment not found'] };
    await supabase.from('drivers').update({ status: 'available', current_assignment_id: null }).eq('id', a.driver_id);
    await supabase.from('assignments').update({ driver_id: newDriver.id }).eq('id', assignmentId);
    await supabase.from('routes').update({ driver_id: newDriver.id }).eq('id', a.route_id);
    await supabase.from('drivers').update({ status: 'busy', current_assignment_id: assignmentId }).eq('id', newDriver.id);
    await supabase.from('trucks').update({ current_driver: newDriver.full_name }).eq('id', a.truck_id);
    await emit(a.company_id, assignmentId, 'driver_reassigned', `Driver reassigned to ${newDriver.full_name}`);
    return { ok: true };
  },
};
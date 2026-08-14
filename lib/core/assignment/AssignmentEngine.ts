import { createClient } from '@supabase/supabase-js';
import { previewRoute, type OptimizationStop } from '@/lib/core/route-optimization';
import { validateAssignment } from './AssignmentValidator';
import { createRoute } from './RouteEngine';
import { emit } from './AssignmentEvents';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

interface LegacyStop { building_id: string; lat: number; lng: number; }

export const AssignmentEngine = {
  async assign(args: { companyId: number; driver: any; truck: any; stops: LegacyStop[]; assignedBy: string }) {
    try {
      const v = validateAssignment(args);
      if (!v.ok) return { ok: false, errors: v.errors };

      const orderedStops: OptimizationStop[] = args.stops.map((s) => ({
        buildingId: s.building_id,
        latitude: s.lat,
        longitude: s.lng,
      }));

      const preview = await previewRoute(orderedStops);
      const distanceKm = preview.distanceKm;
      const durationMin = preview.durationMinutes;

      const geometry = args.stops.map((s, i) => ({
        stop: i + 1, building_id: s.building_id, lat: s.lat, lng: s.lng,
      }));

      const route = await createRoute({
        companyId: args.companyId, truckId: args.truck.id, driverId: args.driver.id,
        geometry, distanceKm, durationMin, totalStops: args.stops.length,
      });

      const { data: assignment, error } = await supabase.from('assignments').insert([{
        company_id: args.companyId, driver_id: args.driver.id, truck_id: args.truck.id,
        route_id: route.id, status: 'assigned', assigned_by: args.assignedBy,
      }]).select().single();
      if (error) return { ok: false, errors: ['assignments: ' + error.message] };

      const { error: abErr } = await supabase.from('assignment_buildings').insert(
        args.stops.map((s, i) => ({ assignment_id: assignment.id, building_id: s.building_id, stop_order: i + 1 }))
      );
      if (abErr) return { ok: false, errors: ['assignment_buildings: ' + abErr.message] };

      const { error: tErr } = await supabase.from('trucks')
        .update({ status: 'assigned', current_driver: args.driver.full_name }).eq('id', args.truck.id);
      const { error: dErr } = await supabase.from('drivers')
        .update({ status: 'busy', current_assignment_id: assignment.id }).eq('id', args.driver.id);
      if (tErr || dErr) return { ok: false, errors: [tErr?.message, dErr?.message].filter(Boolean) as string[] };

      await emit(args.companyId, assignment.id, 'route_assigned', `Route assigned to ${args.driver.full_name} (${args.truck.truck_id}) · ${args.stops.length} stops`);
      return { ok: true, assignment };
    } catch (e: any) {
      return { ok: false, errors: [e?.message || 'Assignment failed'] };
    }
  },

  async reassignTruck(assignmentId: string, newTruck: any) {
    try {
      const { data: a } = await supabase.from('assignments').select('*').eq('id', assignmentId).maybeSingle();
      if (!a) return { ok: false, errors: ['Assignment not found'] };
      await supabase.from('trucks').update({ status: 'available', current_driver: null }).eq('id', a.truck_id);
      await supabase.from('assignments').update({ truck_id: newTruck.id }).eq('id', assignmentId);
      await supabase.from('routes').update({ truck_id: newTruck.id }).eq('id', a.route_id);
      const { data: d } = await supabase.from('drivers').select('full_name').eq('id', a.driver_id).maybeSingle();
      await supabase.from('trucks').update({ status: 'assigned', current_driver: d?.full_name || null }).eq('id', newTruck.id);
      await emit(a.company_id, assignmentId, 'truck_reassigned', `Truck reassigned to ${newTruck.truck_id}`);
      return { ok: true };
    } catch (e: any) {
      return { ok: false, errors: [e?.message || 'Reassign failed'] };
    }
  },

  async reassignDriver(assignmentId: string, newDriver: any) {
    try {
      const { data: a } = await supabase.from('assignments').select('*').eq('id', assignmentId).maybeSingle();
      if (!a) return { ok: false, errors: ['Assignment not found'] };
      await supabase.from('drivers').update({ status: 'available', current_assignment_id: null }).eq('id', a.driver_id);
      await supabase.from('assignments').update({ driver_id: newDriver.id }).eq('id', assignmentId);
      await supabase.from('routes').update({ driver_id: newDriver.id }).eq('id', a.route_id);
      await supabase.from('drivers').update({ status: 'busy', current_assignment_id: assignmentId }).eq('id', newDriver.id);
      await supabase.from('trucks').update({ current_driver: newDriver.full_name }).eq('id', a.truck_id);
      await emit(a.company_id, assignmentId, 'driver_reassigned', `Driver reassigned to ${newDriver.full_name}`);
      return { ok: true };
    } catch (e: any) {
      return { ok: false, errors: [e?.message || 'Reassign failed'] };
    }
  },
};
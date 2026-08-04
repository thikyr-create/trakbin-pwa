// lib/features/buildings/services/buildingService.ts
import { createClient } from '@supabase/supabase-js';
import { resolveNextCollection } from '../utils/buildingHelpers';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export interface BuildingRecord {
  building_id: number;
  custom_id: string;
  address: string | null;
  estate: string | null;
  gps_location_address: string | null;
  building_type: string | null;
  num_flats: string | null;
  num_stores: string | null;
  number_of_units: number | null;
  unit_type: string | null;
  latitude: number | null;
  longitude: number | null;
  status: string;
  payment_status: string;
  passcode: string | null;
  wallet_balance: number | null;
  autopay_enabled: boolean | null;
  autopay_source: string | null;
  billing_day: number | null;
  next_billing_date: string | null;
  created_at: string;
  company_id: number;

  // Enriched fields
  next_collection: string | null;
  zone_name: string | null;
  service_status: string | null;
  pickup_days: string[] | null;
  assigned_driver_name: string | null;
}

export interface BuildingDetail extends BuildingRecord {
  service_assignment: any | null;
  collection_schedule: any | null;
  collections: any[];
  receipts: any[];
  payments: any[];
  issues: any[];
  payment_methods: any[];
}

async function resolveAssignedDrivers(
  customIds: string[]
): Promise<Record<string, string>> {
  const result: Record<string, string> = {};
  if (customIds.length === 0) return result;

  const { data: abs } = await supabase
    .from('assignment_buildings')
    .select('assignment_id, building_id')
    .in('building_id', customIds);
  if (!abs || abs.length === 0) return result;

  const assignmentIds = [...new Set(abs.map((a: any) => a.assignment_id))];
  const { data: assignments } = await supabase
    .from('assignments')
    .select('id, route_id, status')
    .in('id', assignmentIds)
    .neq('status', 'archived');
  if (!assignments || assignments.length === 0) return result;

  const routeIds = [
    ...new Set(assignments.map((a: any) => a.route_id).filter(Boolean)),
  ];
  const assignmentRoute = new Map<string, string>(
    assignments.map((a: any) => [a.id, a.route_id])
  );

  const driverByRoute = new Map<string, string>();
  if (routeIds.length > 0) {
    const { data: routes } = await supabase
      .from('routes')
      .select('id, driver_id')
      .in('id', routeIds);
    (routes || []).forEach((r: any) => {
      if (r.driver_id) driverByRoute.set(r.id, r.driver_id);
    });
  }

  const employeeIds = [...new Set([...driverByRoute.values()])];
  const nameByEmployee = new Map<string, string>();
  if (employeeIds.length > 0) {
    const { data: drivers } = await supabase
      .from('drivers')
      .select('employee_id, full_name')
      .in('employee_id', employeeIds);
    (drivers || []).forEach((d: any) => {
      nameByEmployee.set(d.employee_id, d.full_name);
    });
  }

  const buildingAssignment = new Map<string, string>();
  abs.forEach((a: any) => buildingAssignment.set(a.building_id, a.assignment_id));

  customIds.forEach((cid) => {
    const aid = buildingAssignment.get(cid);
    if (!aid) return;
    const rid = assignmentRoute.get(aid);
    if (!rid) return;
    const emp = driverByRoute.get(rid);
    if (!emp) return;
    const name = nameByEmployee.get(emp);
    if (name) result[cid] = name;
  });

  return result;
}

export async function fetchBuildingsList(company_id: number): Promise<BuildingRecord[]> {
  const { data: buildings, error } = await supabase
    .from('Buildings')
    .select('*')
    .eq('company_id', company_id)
    .order('created_at', { ascending: false });

  if (error || !buildings) {
    console.error('Error fetching buildings:', error);
    return [];
  }

  const customIds = buildings.map((b: any) => b.custom_id).filter(Boolean);

  let assignmentsMap: Record<string, any> = {};
  let zonesMap: Record<string, any> = {};
  let driverMap: Record<string, string> = {};

  if (customIds.length > 0) {
    const [{ data: assignments }, { data: zones }] = await Promise.all([
      supabase
        .from('service_assignments')
        .select('building_id, service_status, zone_id, pickup_days')
        .eq('company_id', company_id)
        .in('building_id', customIds),
      supabase
        .from('company_zones')
        .select('id, zone_name')
        .eq('company_id', company_id),
    ]);

    (assignments || []).forEach((a: any) => {
      assignmentsMap[a.building_id] = a;
    });
    (zones || []).forEach((z: any) => {
      zonesMap[z.id] = z;
    });

    driverMap = await resolveAssignedDrivers(customIds);
  }

  return buildings.map((b: any) => {
    const assignment = assignmentsMap[b.custom_id];

    return {
      ...b,
      next_collection: resolveNextCollection(null, assignment?.pickup_days),
      zone_name:
        assignment && zonesMap[assignment.zone_id]
          ? zonesMap[assignment.zone_id].zone_name
          : null,
      service_status: assignment?.service_status || null,
      pickup_days: assignment?.pickup_days || null,
      assigned_driver_name: driverMap[b.custom_id] || null,
    };
  });
}

export async function fetchBuildingDetail(
  custom_id: string,
  company_id: number
): Promise<BuildingDetail | null> {
  const { data: building, error } = await supabase
    .from('Buildings')
    .select('*')
    .eq('company_id', company_id)
    .eq('custom_id', custom_id)
    .single();

  if (error || !building) {
    console.error('Error fetching building detail:', error);
    return null;
  }

  const [
    { data: assignment },
    { data: schedule },
    { data: collections },
    { data: receipts },
    { data: payments },
    { data: issues },
    { data: paymentMethods },
    { data: zones },
  ] = await Promise.all([
    supabase
      .from('service_assignments')
      .select('*')
      .eq('building_id', custom_id)
      .eq('company_id', company_id)
      .order('activated_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from('collection_schedules')
      .select('*')
      .eq('building_id', custom_id)
      .eq('company_id', company_id)
      .maybeSingle(),
    supabase
      .from('collections')
      .select('*')
      .eq('building_id', custom_id)
      .eq('company_id', company_id)
      .order('collection_date', { ascending: false })
      .limit(20),
    supabase
      .from('receipts')
      .select('*')
      .eq('building_id', custom_id)
      .eq('company_id', company_id)
      .order('issued_at', { ascending: false })
      .limit(20),
    supabase
      .from('payments')
      .select('*')
      .eq('building_id', custom_id)
      .order('created_at', { ascending: false })
      .limit(20),
    supabase
      .from('environmental_issues')
      .select('*')
      .eq('building_id', custom_id)
      .eq('company_id', company_id)
      .order('created_at', { ascending: false })
      .limit(20),
    supabase
      .from('payment_methods')
      .select('*')
      .eq('building_id', custom_id)
      .eq('company_id', company_id),
    supabase
      .from('company_zones')
      .select('id, zone_name')
      .eq('company_id', company_id),
  ]);

  const zonesMap: Record<string, any> = {};
  (zones || []).forEach((z: any) => {
    zonesMap[z.id] = z;
  });

  const driverMap = await resolveAssignedDrivers([custom_id]);

  return {
    ...building,
    next_collection: resolveNextCollection(
      schedule?.next_pickup_date,
      assignment?.pickup_days
    ),
    zone_name:
      assignment && zonesMap[assignment.zone_id]
        ? zonesMap[assignment.zone_id].zone_name
        : null,
    service_status: assignment?.service_status || null,
    pickup_days: assignment?.pickup_days || null,
    assigned_driver_name: driverMap[custom_id] || null,
    service_assignment: assignment,
    collection_schedule: schedule,
    collections: collections || [],
    receipts: receipts || [],
    payments: payments || [],
    issues: issues || [],
    payment_methods: paymentMethods || [],
  };
}
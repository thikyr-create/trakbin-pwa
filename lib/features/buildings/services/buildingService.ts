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
  
  if (customIds.length > 0) {
    const { data: assignments } = await supabase
      .from('service_assignments')
      .select('building_id, service_status, zone_id, pickup_days')
      .eq('company_id', company_id)
      .in('building_id', customIds);
      
    if (assignments) {
      assignments.forEach((a: any) => {
        assignmentsMap[a.building_id] = a;
      });
    }
    
    const { data: zones } = await supabase
      .from('company_zones')
      .select('id, zone_name')
      .eq('company_id', company_id);
      
    if (zones) {
      zones.forEach((z: any) => {
        zonesMap[z.id] = z;
      });
    }
  }

  return buildings.map((b: any) => {
    const assignment = assignmentsMap[b.custom_id];
    const pickupDays = assignment?.pickup_days;
    
    return {
      ...b,
      next_collection: resolveNextCollection(null, pickupDays),
      zone_name: assignment && zonesMap[assignment.zone_id] ? zonesMap[assignment.zone_id].zone_name : null,
      service_status: assignment?.service_status || null,
      assigned_driver_name: null, // Expensive to resolve for the whole list
    };
  });
}

export async function fetchBuildingDetail(custom_id: string, company_id: number): Promise<BuildingDetail | null> {
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
    { data: zones }
  ] = await Promise.all([
    supabase.from('service_assignments').select('*').eq('building_id', custom_id).eq('company_id', company_id).order('activated_at', { ascending: false }).limit(1).maybeSingle(),
    supabase.from('collection_schedules').select('*').eq('building_id', custom_id).eq('company_id', company_id).maybeSingle(),
    supabase.from('collections').select('*').eq('building_id', custom_id).eq('company_id', company_id).order('collection_date', { ascending: false }).limit(20),
    supabase.from('receipts').select('*').eq('building_id', custom_id).eq('company_id', company_id).order('issued_at', { ascending: false }).limit(20),
    supabase.from('payments').select('*').eq('building_id', custom_id).order('created_at', { ascending: false }).limit(20),
    supabase.from('environmental_issues').select('*').eq('building_id', custom_id).eq('company_id', company_id).order('created_at', { ascending: false }).limit(20),
    supabase.from('payment_methods').select('*').eq('building_id', custom_id).eq('company_id', company_id),
    supabase.from('company_zones').select('id, zone_name').eq('company_id', company_id)
  ]);

  const zonesMap: Record<string, any> = {};
  if (zones) zones.forEach((z: any) => { zonesMap[z.id] = z; });

  const pickupDays = assignment?.pickup_days;
  const zoneName = assignment && zonesMap[assignment.zone_id] ? zonesMap[assignment.zone_id].zone_name : null;
  const nextCollection = resolveNextCollection(schedule?.next_pickup_date, pickupDays);

  return {
    ...building,
    next_collection: nextCollection,
    zone_name: zoneName,
    service_status: assignment?.service_status || null,
    assigned_driver_name: null, // Resolved via routes inside drawer if needed
    service_assignment: assignment,
    collection_schedule: schedule,
    collections: collections || [],
    receipts: receipts || [],
    payments: payments || [],
    issues: issues || [],
    payment_methods: paymentMethods || [],
  };
}
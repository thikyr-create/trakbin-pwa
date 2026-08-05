// lib/features/analytics/services/analyticsService.ts
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export interface AnalyticsData {
  buildings: any[];
  trucks: any[];
  drivers: any[];
  receipts: any[];
  invoices: any[];
  issues: any[];
  plannedRuns: number;
  plannedStops: number;
  connectedRuns: number; // assignments joined to a real route
}

export async function fetchAnalyticsData(company_id: number): Promise<AnalyticsData> {
  const [
    { data: buildings },
    { data: trucks },
    { data: drivers },
    { data: receipts },
    { data: invoices },
    { data: issues },
    { data: assignments },
  ] = await Promise.all([
    supabase
      .from('Buildings')
      .select('custom_id, created_at, status, payment_status')
      .eq('company_id', company_id),
    supabase
      .from('trucks')
      .select('truck_id, status, truck_type, capacity')
      .eq('company_id', company_id),
    supabase
      .from('drivers')
      .select('employee_id, full_name, status')
      .eq('company_id', company_id),
    supabase
      .from('receipts')
      .select('gross, issued_at, created_at')
      .eq('company_id', company_id)
      .order('issued_at', { ascending: false })
      .limit(1000),
    supabase
      .from('invoices')
      .select('amount, status, due_date, created_at')
      .eq('company_id', company_id),
    supabase
      .from('environmental_issues')
      .select('issue_type, status, created_at')
      .eq('company_id', company_id),
    supabase
      .from('assignments')
      .select('id, route_id')
      .eq('company_id', company_id),
  ]);

  const assignmentsArr = assignments || [];

  // How many planned runs actually connect to a route? (execution truth)
  let connectedRuns = 0;
  let plannedStops = 0;

  if (assignmentsArr.length > 0) {
    const assignmentIds = assignmentsArr.map((a: any) => a.id);
    const routeIds = assignmentsArr.map((a: any) => a.route_id).filter(Boolean);

    if (routeIds.length > 0) {
      const { data: routes } = await supabase
        .from('routes')
        .select('id')
        .in('id', routeIds);
      const routeSet = new Set((routes || []).map((r: any) => r.id));
      connectedRuns = assignmentsArr.filter((a: any) => routeSet.has(a.route_id)).length;
    }

    const { data: stops } = await supabase
      .from('collections')
      .select('id')
      .in('assignment_id', assignmentIds);
    plannedStops = (stops || []).length;
  }

  return {
    buildings: buildings || [],
    trucks: trucks || [],
    drivers: drivers || [],
    receipts: receipts || [],
    invoices: invoices || [],
    issues: issues || [],
    plannedRuns: assignmentsArr.length,
    plannedStops,
    connectedRuns,
  };
}
// lib/features/finance/services/billingService.ts
import { createClient } from '@supabase/supabase-js';
import { isInvoiceOverdue } from '../utils/billingHelpers';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export interface BillingPlan {
  id: string;
  building_id: string;
  company_id: number;
  amount: number;
  frequency: string;
  due_day: number;
  grace_days: number;
  start_date: string | null;
  status: string;
  created_at: string;
}

export interface InvoiceRow {
  id: number;
  building_id: string;
  amount: number;
  due_date: string;
  status: string;
  description: string | null;
  created_at: string;
  company_id: number;
  paid_at: string | null;
  building_address?: string | null;
  building_estate?: string | null;
}

export interface InvoiceStats {
  issuedToday: number;
  open: number;
  overdue: number;
  paid: number;
  outstandingAmount: number;
}

export async function fetchBillingPlans(company_id: number): Promise<BillingPlan[]> {
  const { data, error } = await supabase
    .from('billing_plans')
    .select('*')
    .eq('company_id', company_id)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching billing plans:', error);
    return [];
  }
  return (data || []) as BillingPlan[];
}

export async function fetchInvoices(company_id: number): Promise<InvoiceRow[]> {
  const { data, error } = await supabase
    .from('invoices')
    .select('*')
    .eq('company_id', company_id)
    .order('due_date', { ascending: false })
    .limit(500);

  if (error) {
    console.error('Error fetching invoices:', error);
    return [];
  }

  const invoices = (data || []) as InvoiceRow[];
  const customIds = [...new Set(invoices.map((i) => i.building_id).filter(Boolean))];

  if (customIds.length > 0) {
    const { data: buildings } = await supabase
      .from('Buildings')
      .select('custom_id, address, estate')
      .eq('company_id', company_id)
      .in('custom_id', customIds);

    const map = new Map<string, any>();
    (buildings || []).forEach((b: any) => map.set(b.custom_id, b));

    invoices.forEach((inv) => {
      const b = map.get(inv.building_id);
      inv.building_address = b?.address || null;
      inv.building_estate = b?.estate || null;
    });
  }

  return invoices;
}

export async function fetchInvoiceStats(company_id: number): Promise<InvoiceStats> {
  const invoices = await fetchInvoices(company_id);

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  let issuedToday = 0;
  let open = 0;
  let overdue = 0;
  let paid = 0;
  let outstandingAmount = 0;

  invoices.forEach((inv) => {
    const created = new Date(inv.created_at);
    if (created >= todayStart) issuedToday += 1;

    if (inv.status === 'paid') {
      paid += 1;
      return;
    }
    if (inv.status === 'cancelled') return;

    // Overdue by status OR by date math (status may lag reality)
    const overdueNow =
      inv.status === 'overdue' ||
      isInvoiceOverdue(inv.due_date, 2);

    if (overdueNow) {
      overdue += 1;
    } else if (inv.status === 'issued' || inv.status === 'viewed' || inv.status === 'draft') {
      open += 1;
    }

    outstandingAmount += Number(inv.amount) || 0;
  });

  return { issuedToday, open, overdue, paid, outstandingAmount };
}

export async function fetchBuildingInvoices(
  building_id: string,
  company_id: number
): Promise<InvoiceRow[]> {
  const { data, error } = await supabase
    .from('invoices')
    .select('*')
    .eq('building_id', building_id)
    .eq('company_id', company_id)
    .order('due_date', { ascending: false });

  if (error) {
    console.error('Error fetching building invoices:', error);
    return [];
  }
  return (data || []) as InvoiceRow[];
}
// lib/features/finance/services/financeService.ts
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export interface MonthlyRevenue {
  month: string; // YYYY-MM
  label: string; // "Aug 2026"
  revenue: number;
  collections: number;
  outstanding: number;
}

export interface OutstandingBill {
  custom_id: string;
  address: string | null;
  estate: string | null;
  amount: number;
  due_date: string | null;
  status: string;
}

export interface Transaction {
  id: string;
  type: 'payment' | 'receipt' | 'settlement';
  building_id: string | null;
  building_address: string | null;
  amount: number;
  status: string;
  method?: string | null;
  provider?: string | null;
  created_at: string;
}

export interface FinanceOverview {
  totalRevenue: number;
  collectedThisMonth: number;
  outstanding: number;
  pendingSettlement: number;
  monthlyRevenue: MonthlyRevenue[];
  outstandingBills: OutstandingBill[];
  transactions: Transaction[];
}

export async function fetchFinanceOverview(company_id: number): Promise<FinanceOverview> {
  const [
    { data: payments },
    { data: receipts },
    { data: ledger },
    { data: buildings },
  ] = await Promise.all([
    supabase
      .from('payments')
      .select('*')
      .eq('building_id', '')
      .or(`company_id.eq.${company_id}`)
      .order('created_at', { ascending: false })
      .limit(100),
    supabase
      .from('receipts')
      .select('*')
      .eq('company_id', company_id)
      .order('issued_at', { ascending: false })
      .limit(100),
    supabase
      .from('ledger_transactions')
      .select('*')
      .eq('company_id', company_id)
      .order('created_at', { ascending: false })
      .limit(100),
    supabase
      .from('Buildings')
      .select('custom_id, address, estate, payment_status, wallet_balance, next_billing_date')
      .eq('company_id', company_id)
      .order('custom_id', { ascending: true }),
  ]);

  const buildingsMap = new Map<string, any>();
  (buildings || []).forEach((b: any) => buildingsMap.set(b.custom_id, b));

  // Monthly revenue aggregation
  const monthlyMap = new Map<string, MonthlyRevenue>();
  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  // Initialize last 6 months
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    monthlyMap.set(key, {
      month: key,
      label: d.toLocaleDateString('en-NG', { month: 'short', year: 'numeric' }),
      revenue: 0,
      collections: 0,
      outstanding: 0,
    });
  }

  let totalRevenue = 0;
  let collectedThisMonth = 0;
  let pendingSettlement = 0;

  // Process receipts (successful collections)
  (receipts || []).forEach((r: any) => {
    const gross = Number(r.gross) || 0;
    const date = new Date(r.issued_at || r.created_at);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

    totalRevenue += gross;

    if (monthlyMap.has(key)) {
      const entry = monthlyMap.get(key)!;
      entry.revenue += gross;
      entry.collections += 1;
    }

    if (key === currentMonth) {
      collectedThisMonth += gross;
    }
  });

  // Process ledger for pending settlements
  (ledger || []).forEach((t: any) => {
    if (t.status === 'pending') {
      pendingSettlement += Number(t.net) || 0;
    }
  });

  // Outstanding bills
  const outstandingBills: OutstandingBill[] = [];
  let totalOutstanding = 0;

  (buildings || []).forEach((b: any) => {
    if (b.payment_status && b.payment_status !== 'paid') {
      const amount = Number(b.wallet_balance) || 0;
      totalOutstanding += amount;
      outstandingBills.push({
        custom_id: b.custom_id,
        address: b.address,
        estate: b.estate,
        amount,
        due_date: b.next_billing_date,
        status: b.payment_status,
      });
    }
  });

  // Unified transaction feed
  const transactions: Transaction[] = [];

  (receipts || []).forEach((r: any) => {
    const b = buildingsMap.get(r.building_id);
    transactions.push({
      id: r.id,
      type: 'receipt',
      building_id: r.building_id,
      building_address: b?.address || r.building_address || null,
      amount: Number(r.gross) || 0,
      status: 'successful',
      provider: r.provider_name || null,
      created_at: r.issued_at || r.created_at,
    });
  });

  (payments || []).forEach((p: any) => {
    const b = buildingsMap.get(p.building_id);
    transactions.push({
      id: p.id,
      type: 'payment',
      building_id: p.building_id,
      building_address: b?.address || null,
      amount: Number(p.amount) || 0,
      status: p.status,
      method: p.method,
      provider: p.provider,
      created_at: p.created_at,
    });
  });

  (ledger || []).forEach((t: any) => {
    if (t.type === 'settlement' || t.status === 'settled') {
      transactions.push({
        id: t.id,
        type: 'settlement',
        building_id: t.building_id,
        building_address: buildingsMap.get(t.building_id)?.address || null,
        amount: Number(t.net) || 0,
        status: t.status,
        created_at: t.created_at,
      });
    }
  });

  transactions.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  return {
    totalRevenue,
    collectedThisMonth,
    outstanding: totalOutstanding,
    pendingSettlement,
    monthlyRevenue: Array.from(monthlyMap.values()),
    outstandingBills: outstandingBills.sort((a, b) => b.amount - a.amount),
    transactions: transactions.slice(0, 50),
  };
}
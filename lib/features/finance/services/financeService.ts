// lib/features/finance/services/financeService.ts
import { supabaseBrowser } from '@/lib/supabaseBrowser';

const supabase = supabaseBrowser;

export interface MonthlyRevenue {
  month: string; // YYYY-MM
  label: string; // "Aug 2026"
  revenue: number; // confirmed money (receipts)
  collections: number; // number of receipts
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
  type: 'receipt' | 'payment' | 'settlement';
  building_id: string | null;
  building_address: string | null;
  amount: number;
  status: string;
  method?: string | null;
  provider?: string | null;
  reference?: string | null;
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
  // 1) Buildings first — they scope payments (payments has no company_id)
  const { data: buildings } = await supabase
    .from('Buildings')
    .select('custom_id, address, estate, payment_status, wallet_balance, next_billing_date')
    .eq('company_id', company_id)
    .order('custom_id', { ascending: true });

  const buildingsArr = buildings || [];
  const buildingsMap = new Map<string, any>();
  buildingsArr.forEach((b: any) => buildingsMap.set(b.custom_id, b));
  const customIds = buildingsArr.map((b: any) => b.custom_id).filter(Boolean);

  let payments: any[] = [];
  let receipts: any[] = [];
  let ledger: any[] = [];

  if (customIds.length > 0) {
    const [p, r, l] = await Promise.all([
      supabase
        .from('payments')
        .select('*')
        .in('building_id', customIds)
        .order('created_at', { ascending: false })
        .limit(200),
      supabase
        .from('receipts')
        .select('*')
        .eq('company_id', company_id)
        .order('issued_at', { ascending: false })
        .limit(200),
      supabase
        .from('ledger_transactions')
        .select('*')
        .eq('company_id', company_id)
        .order('created_at', { ascending: false })
        .limit(200),
    ]);

    payments = p.data || [];
    receipts = r.data || [];
    ledger = l.data || [];
  }

  // 2) Monthly revenue (last 6 months, receipts = confirmed money)
  const monthlyMap = new Map<string, MonthlyRevenue>();
  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    monthlyMap.set(key, {
      month: key,
      label: d.toLocaleDateString('en-NG', { month: 'short', year: 'numeric' }),
      revenue: 0,
      collections: 0,
    });
  }

  let totalRevenue = 0;
  let collectedThisMonth = 0;
  let pendingSettlement = 0;

  receipts.forEach((r: any) => {
    const gross = Number(r.gross) || 0;
    const date = new Date(r.issued_at || r.created_at);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

    totalRevenue += gross;

    const entry = monthlyMap.get(key);
    if (entry) {
      entry.revenue += gross;
      entry.collections += 1;
    }

    if (key === currentMonth) {
      collectedThisMonth += gross;
    }
  });

  ledger.forEach((t: any) => {
    if (t.status === 'pending') {
      pendingSettlement += Number(t.net) || 0;
    }
  });

  // 3) Outstanding bills (buildings not in paid state)
  const outstandingBills: OutstandingBill[] = [];
  let totalOutstanding = 0;

  buildingsArr.forEach((b: any) => {
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

  // 4) Unified transaction feed
  //    receipts = confirmed money · payments = attempts only (pending/failed) ·
  //    settlements = ledger payouts — no double counting
  const transactions: Transaction[] = [];

  receipts.forEach((r: any) => {
    const b = buildingsMap.get(r.building_id);
    transactions.push({
      id: r.id,
      type: 'receipt',
      building_id: r.building_id,
      building_address: b?.address || r.building_address || null,
      amount: Number(r.gross) || 0,
      status: 'successful',
      provider: r.provider_name || null,
      reference: r.receipt_number || null,
      created_at: r.issued_at || r.created_at,
    });
  });

  payments
    .filter((p: any) => p.status !== 'successful')
    .forEach((p: any) => {
      const b = buildingsMap.get(p.building_id);
      transactions.push({
        id: p.id,
        type: 'payment',
        building_id: p.building_id,
        building_address: b?.address || null,
        amount: Number(p.amount) || 0,
        status: p.status,
        method: p.method || p.channel || null,
        provider: p.provider || null,
        reference: p.reference || null,
        created_at: p.created_at,
      });
    });

  ledger.forEach((t: any) => {
    transactions.push({
      id: t.id,
      type: 'settlement',
      building_id: t.building_id,
      building_address: buildingsMap.get(t.building_id)?.address || null,
      amount: Number(t.net) || 0,
      status: t.status,
      reference: t.psp_reference || null,
      created_at: t.created_at,
    });
  });

  transactions.sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

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
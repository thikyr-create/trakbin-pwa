// lib/super-admin/services/billing.service.ts
import { adminSupabase as supabase } from '../supabase/client';

export interface BillingTotals {
  gross: number; commission: number; net: number; settled: number;
  outstanding: number; outstandingPlatform: number;
  refundedCount: number; failedCount: number; collectionsVolume: number;
}
export interface OperatorBalance { key: string; name: string; earned: number; withdrawn: number; available: number; }
export interface BillingData {
  payments: any[]; invoices: any[]; platformInvoices: any[]; payouts: any[]; ledger: any[]; credits: any[];
  totals: BillingTotals; balances: OperatorBalance[];
}

export async function getBillingData(): Promise<BillingData> {
  const [payRes, bRes, hRes, ltRes, invRes, outRes, pinvRes] = await Promise.all([
    supabase.from('payments').select('*').order('created_at', { ascending: false }),
    supabase.from('Buildings').select('custom_id, address, company_id'),
    supabase.from('haulers').select('id, business_name'),
    supabase.from('ledger_transactions').select('*').order('created_at', { ascending: false }),
    supabase.from('invoices').select('*').order('due_date', { ascending: false }),
    supabase.from('payouts').select('*').order('created_at', { ascending: false }),
    supabase.from('platform_invoices').select('*').order('created_at', { ascending: false }),
  ]);

  const buildings = bRes.data || [];
  const haulers = hRes.data || [];
  const ledger = ltRes.data || [];
  const ledgerById = new Map(ledger.map((t: any) => [t.id, t]));

  const payments = (payRes.data || []).map((p: any) => {
    const building = buildings.find((b: any) => b.custom_id === p.building_id);
    const operator = haulers.find((h: any) => h.id === building?.company_id);
    const lt = ledgerById.get(p.ledger_settle_tx) || ledgerById.get(p.ledger_topup_tx);
    return {
      ...p,
      _address: building?.address || null,
      _operator: operator?.business_name || null,
      _commission: lt?.commission ?? null,
      _net: lt?.net ?? null,
      _ledgerTxId: lt?.id ?? null,
    };
  });

  const payouts = outRes.data || [];
  const invoices = invRes.data || [];
  const platformInvoices = pinvRes.data || [];
  const livePayouts = payouts.filter((p: any) => !['rejected', 'failed'].includes(p.status));
  const credits = ledger.filter((t: any) => t.type === 'adjustment_credit');

  const earned = new Map<string, number>();
  ledger.forEach((t: any) => { const k = String(t.company_id ?? 'unattributed'); earned.set(k, (earned.get(k) || 0) + (Number(t.net) || 0)); });
  const withdrawn = new Map<string, number>();
  livePayouts.forEach((p: any) => { const k = String(p.company_id); withdrawn.set(k, (withdrawn.get(k) || 0) + (Number(p.amount) || 0)); });
  const names = new Map(haulers.map((h: any) => [String(h.id), h.business_name]));
  const balances = [...new Set([...earned.keys(), ...withdrawn.keys()])].map((k) => {
    const e = earned.get(k) || 0; const w = withdrawn.get(k) || 0;
    return { key: k, name: names.get(k) || (k === 'unattributed' ? 'Unattributed' : `Operator #${k}`), earned: e, withdrawn: w, available: e - w };
  }).sort((a, b) => b.available - a.available);

  return {
    payments, invoices, platformInvoices, payouts, ledger, credits, balances,
    totals: {
      gross: ledger.reduce((s: number, t: any) => s + (Number(t.gross) || 0), 0),
      commission: ledger.reduce((s: number, t: any) => s + (Number(t.commission) || 0), 0),
      net: ledger.reduce((s: number, t: any) => s + (Number(t.net) || 0), 0),
      settled: livePayouts.reduce((s: number, p: any) => s + (Number(p.amount) || 0), 0),
      outstanding: invoices.filter((i: any) => i.status !== 'paid').reduce((s: number, i: any) => s + (Number(i.amount) || 0), 0),
      outstandingPlatform: platformInvoices.filter((i: any) => i.status !== 'paid').reduce((s: number, i: any) => s + (Number(i.amount) || 0), 0),
      refundedCount: payments.filter((p: any) => p.status === 'refunded').length,
      failedCount: payments.filter((p: any) => p.status === 'failed').length,
      collectionsVolume: payments.filter((p: any) => p.status === 'success').reduce((s: number, p: any) => s + (Number(p.amount) || 0), 0),
    },
  };
}
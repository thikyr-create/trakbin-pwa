// lib/core/finance/settlement-engine/eligibility.ts
import type { SupabaseClient } from '@supabase/supabase-js';

// Derived, never stored: ledger net − live payouts
export async function availableBalance(client: SupabaseClient, companyId: number): Promise<number> {
  const [lt, po] = await Promise.all([
    client.from('ledger_transactions').select('net').eq('company_id', companyId),
    client.from('payouts').select('amount, status').eq('company_id', companyId),
  ]);
  const earned = (lt.data || []).reduce((s: number, t: any) => s + (Number(t.net) || 0), 0);
  const withdrawn = (po.data || [])
    .filter((p: any) => !['rejected', 'failed'].includes(p.status))
    .reduce((s: number, p: any) => s + (Number(p.amount) || 0), 0);
  return earned - withdrawn;
}

export async function canRequestSettlement(client: SupabaseClient, companyId: number, amount: number) {
  if (amount <= 0) return { ok: false, reason: 'Amount must be positive' };
  const available = await availableBalance(client, companyId);
  if (amount > available) return { ok: false, reason: `Exceeds available balance (${available})` };
  return { ok: true, available };
}
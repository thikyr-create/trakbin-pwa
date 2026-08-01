import 'server-only';
import { createClient } from '@supabase/supabase-js';
import { getProvider, DEFAULT_PROVIDER } from './providers';
import { supportsPayoutRecipient, supportsPayoutTransfer } from '@/lib/payments/types';

const admin = () => createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

// TRUST MODEL: with open RLS (the app's current MVP posture) these routes trust
// the company_id on the row. The deferred auth migration MUST derive the company
// from a verified session before money-OUT goes to real operators. The state
// machine (payout_transition) still prevents double-pay regardless.

type Outcome = 'claim' | 'processing' | 'paid' | 'failed' | 'reversed';

async function transition(payoutId: string, outcome: Outcome, pspReference?: string | null, pspFee?: number | null, recipientCode?: string | null) {
  const { data, error } = await admin().rpc('payout_transition', {
    p_id: payoutId, p_outcome: outcome, p_psp_reference: pspReference ?? null, p_psp_fee: pspFee ?? null, p_recipient_code: recipientCode ?? null,
  });
  if (error) throw error;
  return data as any;
}

async function ensureRecipient(companyId: number, recipientId: string): Promise<string> {
  const { data: rec } = await admin().from('company_recipients').select('*').eq('id', recipientId).eq('company_id', companyId).maybeSingle();
  if (!rec) throw new Error('recipient_not_found');
  if (rec.recipient_code) return rec.recipient_code;
  const provider = getProvider(DEFAULT_PROVIDER);
  if (!supportsPayoutRecipient(provider)) throw new Error('provider_cannot_create_recipients');
  const created = await provider.createRecipient({ name: rec.account_name, accountNumber: rec.account_number, bankCode: rec.bank_code, currency: rec.currency });
  await admin().from('company_recipients').update({ recipient_code: created.recipientCode }).eq('id', recipientId);
  return created.recipientCode;
}

// The orchestrator: short locks only; PSP calls happen with NO row lock held.
export async function executePayout(payoutId: string) {
  const { data: po } = await admin().from('payouts').select('*').eq('id', payoutId).maybeSingle();
  if (!po) return { ok: false, reason: 'not_found' };
  if (po.status !== 'requested') return { ok: true, already: true, status: po.status };

  let code: string;
  try { code = await ensureRecipient(po.company_id, po.recipient_id); }
  catch (e: any) { await transition(payoutId, 'failed').catch(() => {}); return { ok: false, reason: e?.message || 'recipient_failed' }; }

  const claim = await transition(payoutId, 'claim', null, null, code);
  if (claim?.already) return { ok: true, already: true, status: claim.status };

  const provider = getProvider(DEFAULT_PROVIDER);
  if (!supportsPayoutTransfer(provider)) { await transition(payoutId, 'failed').catch(() => {}); return { ok: false, reason: 'provider_cannot_transfer' }; }

  let tr;
  try { tr = await provider.transfer({ amountKobo: po.amount * 100, recipientCode: code, reference: `po-${payoutId}`, reason: 'Trakbin payout' }); }
  catch (e: any) { await transition(payoutId, 'failed').catch(() => {}); return { ok: false, reason: e?.message || 'transfer_failed' }; }

  const ref = tr.transferCode;
  const fee = tr.raw?.fees != null ? Math.round(tr.raw.fees / 100) : null;
  const st = String(tr.status || '').toLowerCase();
  const outcome: Outcome = st === 'success' ? 'paid' : (st === 'pending' || st === 'processing') ? 'processing' : 'failed';
  const res = await transition(payoutId, outcome, ref, fee);
  return { ok: true, already: false, status: res?.status || outcome, psp_reference: ref };
}

// Webhook backstop: match a transfer event to its payout by the code we stored.
export async function finalizeByReference(transferCode: string, outcome: 'paid' | 'failed' | 'reversed', pspFee?: number | null) {
  const { data: po } = await admin().from('payouts').select('id').eq('psp_reference', transferCode).maybeSingle();
  if (!po) return { ok: true, unmatched: true }; // admin reconciliation catches the crash-window edge
  const res = await transition(po.id, outcome, transferCode, pspFee ?? null);
  return { ok: true, matched: true, status: res?.status };
}

export async function requestPayout(args: { companyId: number; amount: number; recipientId: string; idempotencyKey: string }) {
  const { data, error } = await admin().rpc('request_payout', { p_company_id: args.companyId, p_amount: Math.trunc(args.amount), p_recipient_id: args.recipientId, p_idempotency_key: args.idempotencyKey });
  if (error) throw error;
  return data as any;
}
export async function listPayouts(companyId: number) {
  const { data, error } = await admin().from('payouts').select('*').eq('company_id', companyId).order('created_at', { ascending: false });
  if (error) throw error; return data || [];
}
export async function saveRecipient(args: { companyId: number; bankCode: string; bankName?: string; accountNumber: string; accountLast4: string; accountName: string; country?: string; currency?: string; }) {
  const { data: existing } = await admin().from('company_recipients').select('id').eq('company_id', args.companyId);
  const isDefault = !existing || existing.length === 0;
  const { error } = await admin().from('company_recipients').insert([{
    company_id: args.companyId, bank_code: args.bankCode, bank_name: args.bankName ?? null,
    account_number: args.accountNumber, account_last4: args.accountLast4, account_name: args.accountName,
    country: args.country ?? 'NG', currency: args.currency ?? 'NGN', is_default: isDefault,
  }]);
  if (error) throw error; return { ok: true };
}
// client-safe shape: NEVER the full account number
export async function listRecipients(companyId: number) {
  const { data, error } = await admin().from('company_recipients')
    .select('id,company_id,bank_code,bank_name,account_last4,account_name,recipient_code,country,currency,is_default,verified_at,created_at')
    .eq('company_id', companyId).order('created_at', { ascending: false });
  if (error) throw error; return data || [];
}
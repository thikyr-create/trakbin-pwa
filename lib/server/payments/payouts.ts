import 'server-only';
import { createClient } from '@supabase/supabase-js';

const admin = () => createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

// TRUST MODEL (read before shipping to real operators): these routes take
// companyId from the request body, matching the app's current no-auth MVP
// (open RLS). For money-OUT this is the #1 thing the deferred auth migration
// must lock down — derive the company from a verified session, never the body.
// The reservation here only *holds* funds; the irreversible bank transfer in
// 6.2b must re-verify ownership server-side before any cash moves.

export async function requestPayout(args: { companyId: number; amount: number; recipientId: string; idempotencyKey: string }) {
  const { data, error } = await admin().rpc('request_payout', {
    p_company_id: args.companyId, p_amount: Math.trunc(args.amount),
    p_recipient_id: args.recipientId, p_idempotency_key: args.idempotencyKey,
  });
  if (error) throw error;
  return data as any;
}

export async function listPayouts(companyId: number) {
  const { data, error } = await admin().from('payouts').select('*')
    .eq('company_id', companyId).order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function saveRecipient(args: {
  companyId: number; bankCode: string; bankName?: string; accountLast4: string;
  accountName: string; country?: string; currency?: string;
}) {
  const { data: existing } = await admin().from('company_recipients').select('id').eq('company_id', args.companyId);
  const isDefault = !existing || existing.length === 0;
  const { error } = await admin().from('company_recipients').insert([{
    company_id: args.companyId, bank_code: args.bankCode, bank_name: args.bankName ?? null,
    account_last4: args.accountLast4, account_name: args.accountName,
    country: args.country ?? 'NG', currency: args.currency ?? 'NGN', is_default: isDefault,
  }]);
  if (error) throw error;
  return { ok: true };
}

export async function listRecipients(companyId: number) {
  const { data, error } = await admin().from('company_recipients').select('*')
    .eq('company_id', companyId).order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}
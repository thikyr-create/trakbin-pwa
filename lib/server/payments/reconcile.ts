import 'server-only';
import { createClient } from '@supabase/supabase-js';

const admin = () => createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

// Record a transfer event the PSP confirmed; mark matched if we could tie it to
// a payout by the reference we stored. Called from finalizeByReference.
export async function recordTransferEvent(args: {
  transferCode: string; status: string; amount?: number | null; currency?: string | null;
  matched: boolean; matchedPayoutId?: string | null; raw?: any;
}) {
  const { error } = await admin().from('psp_transfer_events').upsert(
    {
      transfer_code: args.transferCode, status: args.status, amount: args.amount ?? null,
      currency: args.currency ?? null, matched: args.matched, matched_payout_id: args.matchedPayoutId ?? null,
      raw: args.raw ?? null, received_at: new Date().toISOString(),
    },
    { onConflict: 'transfer_code' }
  );
  if (error) throw error;
}

export async function listUnmatched() {
  const { data, error } = await admin().from('psp_transfer_events')
    .select('*').eq('matched', false).order('received_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

// Manual reconciliation: tie an unmatched event to its payout, stamp the
// reference, then drive the state machine to the event's outcome. Idempotent.
export async function reconcile(eventId: string, payoutId: string) {
  const { data: ev } = await admin().from('psp_transfer_events').select('*').eq('id', eventId).maybeSingle();
  if (!ev) return { ok: false, reason: 'event_not_found' };
  if (ev.matched) return { ok: true, already: true };
  const { data: po } = await admin().from('payouts').select('*').eq('id', payoutId).maybeSingle();
  if (!po) return { ok: false, reason: 'payout_not_found' };

  await admin().from('payouts').update({ psp_reference: ev.transfer_code }).eq('id', payoutId).is('psp_reference', null);

  const outcome = ev.status === 'success' ? 'paid' : ev.status === 'reversed' ? 'reversed' : 'failed';
  const { data: tr, error } = await admin().rpc('payout_transition', {
    p_id: payoutId, p_outcome: outcome, p_psp_reference: ev.transfer_code, p_psp_fee: null, p_recipient_code: null,
  });
  if (error) throw error;

  await admin().from('psp_transfer_events').update({ matched: true, matched_payout_id: payoutId }).eq('id', eventId);
  return { ok: true, status: tr?.status ?? outcome };
}
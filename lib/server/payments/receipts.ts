import 'server-only';
import { createClient } from '@supabase/supabase-js';

const admin = () => createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

export type ReceiptView = 'customer' | 'operator' | 'admin';

// Mint (idempotent) and return the raw receipt row for an envelope.
export async function mintReceipt(ledgerTxId: string) {
  const { data, error } = await admin().rpc('mint_receipt', { p_ledger_tx_id: ledgerTxId });
  if (error) throw error;
  return data as any;
}

// Resolve a receipt by whatever the caller holds (number | ledger tx | invoice),
// minting on read if the envelope has no receipt yet (closes any mint window +
// backfills pre-receipts history). Returns the raw row or null.
export async function resolveReceipt(ref: { number?: string; tx?: string; invoice?: string }) {
  if (ref.number) {
    const { data } = await admin().from('receipts').select('*').eq('receipt_number', ref.number).maybeSingle();
    return data || null;
  }
  if (ref.tx) {
    let { data } = await admin().from('receipts').select('*').eq('ledger_tx_id', ref.tx).maybeSingle();
    if (!data) data = await mintReceipt(ref.tx);
    return data || null;
  }
  if (ref.invoice) {
    let { data } = await admin().from('receipts').select('*').eq('invoice_id', ref.invoice).maybeSingle();
    if (!data) {
      const { data: env } = await admin().from('ledger_transactions').select('id').eq('invoice_id', ref.invoice).eq('type', 'settlement').maybeSingle();
      if (env) data = await mintReceipt(env.id);
    }
    return data || null;
  }
  return null;
}

// Project the frozen document for an actor. The customer copy NEVER carries the
// operator's split (R9 on paper); operator gets the fee breakdown; admin gets all.
export function projectReceipt(r: any, view: ReceiptView) {
  const base = {
    receipt_number: r.receipt_number, issued_at: r.issued_at, purpose: r.purpose,
    gross: r.gross, currency: r.currency, line_items: r.line_items,
    building_address: r.building_address, provider_name: r.provider_name,
  };
  if (view === 'customer') return base;
  if (view === 'operator') {
    return {
      ...base, net: r.net, commission: r.commission, commission_bps: r.commission_bps, fee_model: r.fee_model,
    };
  }
  // admin — the whole truth
  return {
    ...base, net: r.net, commission: r.commission, commission_bps: r.commission_bps, fee_model: r.fee_model,
    ledger_tx_id: r.ledger_tx_id, invoice_id: r.invoice_id, company_id: r.company_id, building_id: r.building_id,
    payer_email: r.payer_email,
  };
}

// Ownership gate consistent with the app's MVP trust model (caller-supplied id
// must own the receipt; admin bypasses). The deferred auth migration replaces
// this with a session-derived check.
export function ownsReceipt(r: any, view: ReceiptView, owner: string | null): boolean {
  if (view === 'admin') return true;
  if (!owner) return false;
  if (view === 'customer') return String(r.building_id) === String(owner);
  if (view === 'operator') return String(r.company_id) === String(owner);
  return false;
}
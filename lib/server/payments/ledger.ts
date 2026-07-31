import 'server-only';
import { createClient } from '@supabase/supabase-js';

// Service-role client: the engine writes regardless of RLS. Server-only by construction.
const admin = () => createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

// Credit the building wallet for a verified external top-up.
// The PSP reference IS the idempotency key => a retried webhook can't double-credit.
export async function creditWalletForTopup(buildingId: string, amountNaira: number, pspReference: string, provider: string) {
  const { data, error } = await admin().rpc('record_topup', {
    p_building_id: buildingId,
    p_amount: amountNaira,
    p_idempotency_key: `psp-${provider}-${pspReference}`,
    p_psp_reference: pspReference,
  });
  if (error) throw error;
  return data as any;
}

// Settle an invoice from the wallet (the single settlement choke point).
export async function settleInvoiceFromWallet(invoiceId: string, idempotencyKey: string, source = 'wallet') {
  const { data, error } = await admin().rpc('settle_invoice', {
    p_invoice_id: invoiceId,
    p_idempotency_key: idempotencyKey,
    p_source: source,
  });
  if (error) throw error;
  return data as any;
}
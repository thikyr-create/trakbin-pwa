import 'server-only';
import { createClient } from '@supabase/supabase-js';
import { getProvider, DEFAULT_PROVIDER } from './providers';
import { creditWalletForTopup, settleInvoiceFromWallet } from './ledger';
import type { PaymentProviderName, VerifyResult } from '@/lib/payments/types';

const admin = () => createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

export interface InitializeArgs {
  amount: number;
  purpose: 'topup' | 'invoice';
  invoiceId?: string;
  buildingId: string;
  email: string;
  method?: string;
  provider?: PaymentProviderName;
  callbackUrl: string;
}

// Start a payment: pre-check, ask the provider, record a pending payment row.
export async function initializePayment(args: InitializeArgs) {
  const providerName = args.provider || DEFAULT_PROVIDER;
  const provider = getProvider(providerName);

  // Pre-checks — never take card money we can't correctly apply.
  if (args.purpose === 'invoice') {
    if (!args.invoiceId) throw new Error('invoice_id_required');
    const { data: inv } = await admin().from('invoices').select('status, amount, building_id').eq('id', args.invoiceId).maybeSingle();
    if (!inv) throw new Error('invoice_not_found');
    if (inv.status === 'paid') throw new Error('invoice_already_paid');
    if (args.amount !== inv.amount) throw new Error('amount_mismatch');
    const { data: bld } = await admin().from('Buildings').select('company_id').eq('custom_id', inv.building_id).maybeSingle();
    if (!bld?.company_id) throw new Error('no_provider_assigned');
  }

  const init = await provider.initialize({
    amount: args.amount,
    currency: 'NGN',
    email: args.email,
    method: args.method as any,
    purpose: args.purpose,
    invoiceId: args.invoiceId,
    buildingId: args.buildingId,
    metadata: { callback_url: args.callbackUrl },
  });

  await admin().from('payments').insert({
    provider: providerName,
    reference: init.reference,
    building_id: args.buildingId,
    invoice_id: args.invoiceId ?? null,
    payer_email: args.email,
    purpose: args.purpose,
    method: args.method ?? null,
    amount: args.amount,
    currency: 'NGN',
    status: 'pending',
  });

  return { provider: providerName, reference: init.reference, authorizationUrl: init.authorizationUrl, clientPayload: init.clientPayload };
}

// Apply a verified successful charge. Idempotent end-to-end via the PSP reference.
export async function handleSuccessfulPayment(verify: VerifyResult, meta: { purpose: string; invoiceId?: string | null; buildingId: string }) {
  const ref = verify.reference;
  const amount = verify.amount;

  if (meta.purpose === 'topup') {
    const topup = await creditWalletForTopup(meta.buildingId, amount, ref, verify.provider);
    await admin().from('payments').update({
      status: 'success', channel: verify.channel ?? null, psp_fee: verify.pspFee ?? null,
      ledger_topup_tx: topup?.transaction_id ?? null, raw: verify.raw ?? null, updated_at: new Date().toISOString(),
    }).eq('reference', ref);
    return { ok: true, action: 'topup', transaction_id: topup?.transaction_id };
  }

  if (meta.purpose === 'invoice' && meta.invoiceId) {
    // Funds flow in (rail -> wallet), then out (wallet -> provider + platform).
    const topup = await creditWalletForTopup(meta.buildingId, amount, ref, verify.provider);
    const settle = await settleInvoiceFromWallet(meta.invoiceId, `psp-${verify.provider}-${ref}-settle`, 'wallet');
    await admin().from('payments').update({
      status: 'success', channel: verify.channel ?? null, psp_fee: verify.pspFee ?? null,
      ledger_topup_tx: topup?.transaction_id ?? null, ledger_settle_tx: settle?.transaction_id ?? null,
      raw: verify.raw ?? null, updated_at: new Date().toISOString(),
    }).eq('reference', ref);
    return { ok: true, action: 'invoice', topup_tx: topup?.transaction_id, settle_tx: settle?.transaction_id };
  }

  throw new Error('unknown_purpose');
}

export async function markFailed(ref: string) {
  await admin().from('payments').update({ status: 'failed', updated_at: new Date().toISOString() }).eq('reference', ref);
}
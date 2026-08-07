// lib/server/payments/engine.ts
import 'server-only';
import { createClient } from '@supabase/supabase-js';
import { getProvider, DEFAULT_PROVIDER } from './providers';
import { creditWalletForTopup, settleInvoiceFromWallet } from './ledger';
import { mintReceipt } from './receipts';
import { BillingPublisher } from '@/lib/core/event-bus';
import type { PaymentProviderName, VerifyResult } from '@/lib/payments/types';

const admin = () => createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

// A receipt is a document ABOUT a committed envelope, so minting it is best-effort:
// a receipt failure must never fail a payment. The /api/receipts route also
// mints on read, so any missed mint here is healed the first time it's viewed.
async function tryMint(ledgerTxId: string | null | undefined) {
  if (!ledgerTxId) return;
  try { await mintReceipt(ledgerTxId); } catch (e) { console.warn('receipt mint deferred:', e); }
}

export interface InitializeArgs {
  amount: number; purpose: 'topup' | 'invoice'; invoiceId?: string; buildingId: string;
  email: string; method?: string; provider?: PaymentProviderName; callbackUrl: string;
}

export async function initializePayment(args: InitializeArgs) {
  const providerName = args.provider || DEFAULT_PROVIDER;
  const provider = getProvider(providerName);
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
    amount: args.amount, currency: 'NGN', email: args.email, method: args.method as any,
    purpose: args.purpose, invoiceId: args.invoiceId, buildingId: args.buildingId, metadata: { callback_url: args.callbackUrl},
  });
  await admin().from('payments').insert({
    provider: providerName, reference: init.reference, building_id: args.buildingId,
    invoice_id: args.invoiceId ?? null, payer_email: args.email, purpose: args.purpose,
    method: args.method ?? null, amount: args.amount, currency: 'NGN', status: 'pending',
  });
  return { provider: providerName, reference: init.reference, authorizationUrl: init.authorizationUrl, clientPayload: init.clientPayload };
}

export async function chargeLinkedBank(args: { buildingId: string; methodId: string; amount: number; email: string }) {
  const { data: method } = await admin().from('payment_methods').select('*').eq('id', args.methodId).eq('building_id', args.buildingId).maybeSingle();
  if (!method || method.instrument_type !== 'bank_account') throw new Error('bank_method_not_found');
  if (!method.account_number || !method.account_name) throw new Error('bank_method_incomplete');
  const provider = getProvider((method.provider as PaymentProviderName) || DEFAULT_PROVIDER);
  const init = await provider.initialize({
    amount: args.amount, currency: 'NGN', email: args.email, method: 'bank', purpose: 'topup', buildingId: args.buildingId,
    metadata: { callback_url: '', bank_account: method.account_number, account_name: method.account_name, bank_code: method.bank_code },
  });
  await admin().from('payments').insert({
    provider: provider.name, reference: init.reference, building_id: args.buildingId, payer_email: args.email,
    purpose: 'topup', method: 'bank', channel: 'bank', amount:args.amount, currency: 'NGN', status: 'pending',
  });
  const verify = await provider.verify(init.reference);
  if (verify.status !== 'success') {
    await admin().from('payments').update({ status: 'failed', updated_at: new Date().toISOString() }).eq('reference', init.reference);
    throw new Error('bank_charge_not_confirmed');
  }
  const topup = await creditWalletForTopup(args.buildingId, verify.amount, verify.reference, provider.name);
  await admin().from('payments').update({
    status: 'success', channel: verify.channel ?? 'bank', psp_fee: verify.pspFee ?? null,
    ledger_topup_tx: topup?.transaction_id ?? null, updated_at: new Date().toISOString(),
  }).eq('reference', verify.reference);
  await tryMint(topup?.transaction_id);
  
  // EVENT BUS
  BillingPublisher.publish('PAYMENT_RECEIVED', { buildingId: args.buildingId, companyId: null });
  
  return { ok: true, reference: verify.reference, amount: verify.amount };
}

export async function handleSuccessfulPayment(verify: VerifyResult, meta: { purpose: string; invoiceId?: string | null; buildingId: string }) {
  const ref = verify.reference;
  const amount = verify.amount;
  if (meta.purpose === 'topup') {
    const topup = await creditWalletForTopup(meta.buildingId, amount, ref, verify.provider);
    await admin().from('payments').update({
      status: 'success', channel: verify.channel ?? null, psp_fee: verify.pspFee ?? null,
      ledger_topup_tx: topup?.transaction_id ?? null, raw: verify.raw ?? null, updated_at: new Date().toISOString(),
    }).eq('reference', ref);
    await tryMint(topup?.transaction_id);
    
    // EVENT BUS: broadcast payment received
    BillingPublisher.publish('PAYMENT_RECEIVED', { buildingId: meta.buildingId, companyId: null });
    
    return { ok: true, action: 'topup', transaction_id: topup?.transaction_id };
  }
  if (meta.purpose === 'invoice' && meta.invoiceId) {
    const topup = await creditWalletForTopup(meta.buildingId, amount, ref, verify.provider);
    const settle = await settleInvoiceFromWallet(meta.invoiceId, `psp-${verify.provider}-${ref}-settle`, 'wallet');
    await admin().from('payments').update({
      status: 'success', channel: verify.channel ?? null, psp_fee: verify.pspFee ?? null,
      ledger_topup_tx: topup?.transaction_id ?? null, ledger_settle_tx: settle?.transaction_id ?? null,
      raw: verify.raw ?? null, updated_at: new Date().toISOString(),
    }).eq('reference', ref);
    await tryMint(settle?.transaction_id);
    
    // EVENT BUS: broadcast payment received with company context
    const { data: bld } = await admin().from('Buildings').select('company_id').eq('custom_id', meta.buildingId).maybeSingle();
    BillingPublisher.publish('PAYMENT_RECEIVED', { buildingId: meta.buildingId, companyId: bld?.company_id ?? null });
    
    return { ok: true, action: 'invoice', topup_tx: topup?.transaction_id, settle_tx: settle?.transaction_id };
  }
  throw new Error('unknown_purpose');
}

export async function markFailed(ref: string) {
  await admin().from('payments').update({ status: 'failed', updated_at: new Date().toISOString() }).eq('reference', ref);
}
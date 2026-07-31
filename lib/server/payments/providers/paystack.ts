import 'server-only';
import type { PaymentProvider, InitializeInput, InitializeResult, VerifyResult, RefundResult, PaymentStatus, PaymentMethod } from '@/lib/payments/types';

const BASE = 'https://api.paystack.co';
const secret = () => {
  const s = process.env.PAYSTACK_SECRET_KEY;
  if (!s) throw new Error('PAYSTACK_SECRET_KEY is not set');
  return s;
};

async function psFetch(path: string, opts: RequestInit = {}) {
  const res = await fetch(`${BASE}${path}`, {
    ...opts,
    headers: { Authorization: `Bearer ${secret()}`, 'Content-Type': 'application/json', ...(opts.headers || {}) },
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok || json.status === false) throw new Error(`Paystack error: ${json.message || res.statusText}`);
  return json;
}

// Paystack channels are a closed set; map our method enum onto them.
function channelsFor(method?: PaymentMethod): string[] {
  switch (method) {
    case 'bank': return ['bank'];
    case 'ussd': return ['ussd'];
    case 'mobile_money': return ['mobile_money'];
    case 'card': return ['card'];
    default: return ['card', 'bank', 'ussd']; // let the customer choose on the hosted page
  }
}

export const paystackProvider: PaymentProvider = {
  name: 'paystack',

  async initialize(input: InitializeInput): Promise<InitializeResult> {
    const reference = `trk_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
    const body = {
      email: input.email,
      amount: input.amount * 100,          // Paystack wants KOBO (minor units)
      currency: input.currency || 'NGN',
      reference,
      channels: channelsFor(input.method),
      callback_url: input.metadata?.callback_url,
      metadata: { purpose: input.purpose, invoiceId: input.invoiceId ?? null, buildingId: input.buildingId },
    };
    const json = await psFetch('/transaction/initialize', { method: 'POST', body: JSON.stringify(body) });
    return { provider: 'paystack', reference: json.data.reference, authorizationUrl: json.data.authorization_url };
  },

  async verify(reference: string): Promise<VerifyResult> {
    const json = await psFetch(`/transaction/verify/${encodeURIComponent(reference)}`);
    const d = json.data;
    const status: PaymentStatus = d.status === 'success' ? 'success' : d.status === 'failed' ? 'failed' : 'pending';
    return {
      provider: 'paystack',
      reference: d.reference,
      status,
      amount: Math.round((d.amount || 0) / 100),   // kobo -> Naira
      currency: d.currency || 'NGN',
      channel: d.channel,
      pspFee: d.fees != null ? Math.round(d.fees / 100) : undefined,
      raw: d,
    };
  },

  async refund(reference: string, amount?: number): Promise<RefundResult> {
    const body: any = { transaction: reference };
    if (amount) body.amount = amount * 100;
    const json = await psFetch('/refund', { method: 'POST', body: JSON.stringify(body) });
    return { status: 'refunded', raw: json.data };
  },
};
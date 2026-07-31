import 'server-only';
import type {
  PaymentProvider, InitializeInput, InitializeResult, VerifyResult, RefundResult,
  PaymentStatus, PaymentMethod, BankInfo, ListBanksOptions, ResolveAccountOptions, ResolvedAccount,
} from '@/lib/payments/types';
import { ttlGet, ttlSet } from '../cache';

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

// ISO alpha-2 -> the word Paystack's /bank endpoint expects. One-line-per-market;
// adding a country never touches the API contract or the UI.
const ISO_TO_PAYSTACK_COUNTRY: Record<string, string> = {
  NG: 'nigeria', GH: 'ghana', ZA: 'south africa', KE: 'kenya',
};

function channelsFor(method?: PaymentMethod): string[] {
  switch (method) {
    case 'bank': return ['bank'];
    case 'ussd': return ['ussd'];
    case 'mobile_money': return ['mobile_money'];
    case 'card': return ['card'];
    default: return ['card', 'bank', 'ussd'];
  }
}

export const paystackProvider: PaymentProvider & {
  listBanks(opts: ListBanksOptions): Promise<BankInfo[]>;
  resolveAccount(opts: ResolveAccountOptions): Promise<ResolvedAccount>;
} = {
  name: 'paystack',

  async initialize(input: InitializeInput): Promise<InitializeResult> {
    const reference = `trk_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
    const body = {
      email: input.email,
      amount: input.amount * 100,                 // Paystack wants KOBO
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
      provider: 'paystack', reference: d.reference, status,
      amount: Math.round((d.amount || 0) / 100),    // kobo -> Naira
      currency: d.currency || 'NGN', channel: d.channel,
      pspFee: d.fees != null ? Math.round(d.fees / 100) : undefined, raw: d,
    };
  },

  async refund(reference: string, amount?: number): Promise<RefundResult> {
    const body: any = { transaction: reference };
    if (amount) body.amount = amount * 100;
    const json = await psFetch('/refund', { method: 'POST', body: JSON.stringify(body) });
    return { status: 'refunded', raw: json.data };
  },

  // ── bank directory (cached 24h; banks rarely change) ───────────────────
  async listBanks(opts: ListBanksOptions): Promise<BankInfo[]> {
    const country = ISO_TO_PAYSTACK_COUNTRY[String(opts.country || 'NG').toUpperCase()] || 'nigeria';
    const currency = opts.currency || 'NGN';
    const key = `banks:paystack:${country}:${currency}`;
    const cached = ttlGet<BankInfo[]>(key);
    if (cached) return cached;

    const json = await psFetch(`/bank?country=${encodeURIComponent(country)}&currency=${encodeURIComponent(currency)}`);
    const banks: BankInfo[] = (json.data || []).map((b: any) => ({
      code: String(b.code),
      name: String(b.name),
      currency: b.currency || currency,
      country: opts.country || 'NG',
      payWithBank: !!b.pay_with_bank,
      supportsTransfer: !!b.supports_transfer,
    }));
    ttlSet(key, banks, 24 * 60 * 60 * 1000);
    return banks;
  },

  // ── account name enquiry (never cached — must be live) ─────────────────
  async resolveAccount(opts: ResolveAccountOptions): Promise<ResolvedAccount> {
    const accountNumber = String(opts.accountNumber || '').replace(/[^\d]/g, '');
    const json = await psFetch(`/bank/resolve?account_number=${encodeURIComponent(accountNumber)}&bank_code=${encodeURIComponent(opts.bankCode)}`);
    return {
      accountName: String(json.data?.account_name || ''),
      accountNumber,
      bankCode: opts.bankCode,
    };
  },
};
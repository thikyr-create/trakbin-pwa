import { supabase } from './supabase';
import { API_BASE } from './caretaker';

async function safeJson(res: Response) {
  const txt = await res.text();
  try { return JSON.parse(txt); } catch { throw new Error(`Backend non-JSON. Check API_BASE. (${txt.slice(0, 60)})`); }
}

// ── BANKS ───────────────────────────────────────────────────
// Fallback only if the API is unreachable (e.g. offline). The PWA fetches the
// full licensed list from Paystack via /api/banks and sorts alphabetically.
const FALLBACK_BANKS = [
  { code: '058', name: 'Guaranty Trust Bank' },
  { code: '044', name: 'Access Bank' },
  { code: '057', name: 'Zenith Bank' },
  { code: '011', name: 'First Bank of Nigeria' },
  { code: '033', name: 'United Bank for Africa' },
  { code: '070', name: 'Fidelity Bank' },
  { code: '032', name: 'Union Bank' },
  { code: '221', name: 'Stanbic IBTC Bank' },
  { code: '232', name: 'Sterling Bank' },
  { code: '035', name: 'Wema Bank' },
  { code: '50211', name: 'Kuda' },
  { code: '100004', name: 'Opay' },
  { code: '100010', name: 'PalmPay' },
  { code: '100023', name: 'Moniepoint' },
];

/**
 * Fetch the full licensed bank list from Paystack via the PWA backend.
 * Mirrors PWA BankPicker: fetch /api/banks, parse .banks, sort alphabetically.
 */
export async function fetchBanks(): Promise<{ code: string; name: string }[]> {
  try {
    const res = await fetch(`${API_BASE}/api/banks?country=NG&currency=NGN`);
    const json = await safeJson(res);
    // PWA returns { ok, country, currency, provider, banks: [...] }
    const banks = json?.banks ?? [];
    if (Array.isArray(banks) && banks.length) {
      // Alphabetical sort, identical to PWA BankPicker
      return banks.sort((a: any, b: any) =>
        String(a.name || '').localeCompare(String(b.name || ''))
      );
    }
    return FALLBACK_BANKS;
  } catch {
    return FALLBACK_BANKS;
  }
}

/**
 * Resolve a bank account name via the PWA backend.
 * Mirrors PWA BankPicker resolve: /api/banks/resolve?country=...&bankCode=...&account=...
 */
/**
 * Resolve a bank account name via the PWA backend.
 * PWA endpoint returns { ok, accountName, accountNumber, bankCode, bankName } (camelCase).
 */
export async function resolveBankAccount(bankCode: string, accountNumber: string) {
  try {
    const res = await fetch(
      `${API_BASE}/api/banks/resolve?country=NG&bankCode=${encodeURIComponent(bankCode)}&account=${encodeURIComponent(accountNumber)}`
    );
    const json = await safeJson(res);
    if (!json.ok) return { ok: false, error: json.error ?? 'account_not_found', accountName: null };
    return { ok: true, accountName: json.accountName ?? null, account_name: json.accountName ?? null };
  } catch (e: any) {
    return { ok: false, error: e.message ?? 'resolve_failed', accountName: null };
  }
}

// ── PAYMENT METHODS ─────────────────────────────────────────
export async function addPaymentMethod(p: any) {
  const { error } = await supabase.from('payment_methods').insert([{
    building_id: p.buildingId,
    company_id: p.companyId ?? null,
    instrument_type: p.instrumentType ?? 'bank_account',
    provider: p.provider ?? 'paystack',
    country: p.country ?? 'NG',
    currency: p.currency ?? 'NGN',
    bank_code: p.bankCode ?? null,
    bank_name: p.bankName ?? null,
    account_number: p.accountNumber ?? null,
    account_name: p.accountName ?? null,
    is_default: p.isDefault ?? false,
  }]);
  return { ok: !error, error: error?.message };
}

// ── WALLET TOP-UP ───────────────────────────────────────────
export async function initializeWalletTopUp(a: any, b?: any, c?: any, d?: any) {
  let p: { buildingId: string; email: string; amountNaira: number; method?: 'bank' | 'card' };

  if (typeof a === 'object' && a !== null) {
    p = a;
  } else {
    const rest = [b, c];
    const email = rest.find((x) => typeof x === 'string') ?? '';
    const amount = rest.find((x) => typeof x === 'number') ?? 0;
    p = { buildingId: a, email, amountNaira: amount, method: d };
  }

  const res = await fetch(`${API_BASE}/api/payments/initialize`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      buildingId: p.buildingId,
      email: p.email,
      amount: p.amountNaira,
      purpose: 'topup',
      provider: 'paystack',
      ...(p.method ? { method: p.method } : {}),
    }),
  });
  const json = await safeJson(res);
  if (!json.ok) throw new Error(json.error ?? 'Initialize failed');
  return { ok: true, reference: json.reference, authorizationUrl: json.authorizationUrl };
}

export async function verifyTopUp(reference: string) {
  const res = await fetch(`${API_BASE}/api/payments/verify?reference=${encodeURIComponent(reference)}`);
  return safeJson(res);
}
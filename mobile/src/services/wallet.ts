import { supabase, API_BASE } from './supabase';

async function safeJson(res: Response): Promise<any> {
  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch {
    return { ok: false, error: `non_json_response_${res.status}` };
  }
}

export async function initializeWalletTopUp(
  buildingId: string,
  amountKobo: number,
  email: string
): Promise<{ ok: boolean; reference?: string; authorizationUrl?: string; error?: string }> {
  try {
    const res = await fetch(`${API_BASE}/api/payments/initialize`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        buildingId,
        amount: amountKobo,
        email,
        purpose: 'wallet_topup',
        method: 'card',
        provider: 'paystack',
      }),
    });
    return await safeJson(res);
  } catch {
    return { ok: false, error: 'network' };
  }
}

export async function fetchBanks(): Promise<{ code: string; name: string }[]> {
  try {
    const res = await fetch(`${API_BASE}/api/banks?country=NG&currency=NGN`);
    const json = await safeJson(res);
    return json?.banks ?? [];
  } catch {
    return [];
  }
}

export async function resolveBankAccount(
  accountNumber: string,
  bankCode: string
): Promise<{ accountName: string; accountNumber: string } | null> {
  try {
    // Send both naming conventions; the route reads whichever it expects.
    const params = new URLSearchParams({
      country: 'NG',
      bank_code: bankCode,
      bankCode,
      account_number: accountNumber,
      account: accountNumber,
    });
    const res = await fetch(`${API_BASE}/api/banks/resolve?${params.toString()}`);
    const json = await safeJson(res);
    if (!json?.ok) return null;
    return {
      accountName: json.accountName ?? json.data?.accountName ?? '',
      accountNumber,
    };
  } catch {
    return null;
  }
}

export async function addPaymentMethod(input: {
  buildingId: string;
  instrumentType: 'bank_account' | 'card';
  provider: string;
  country: string;
  currency: string;
  bankCode?: string;
  bankName?: string;
  accountNumber?: string;
  accountName?: string;
  isDefault?: boolean;
}): Promise<{ ok: boolean; error?: string }> {
  try {
    const res = await fetch(`${API_BASE}/api/payment-methods`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });
    return await safeJson(res);
  } catch {
    return { ok: false, error: 'network' };
  }
}

// Mirrors the PWA caretaker session: direct Supabase update, RLS-scoped.
export async function setAutopay(
  customId: string,
  enabled: boolean,
  source?: string | null
): Promise<{ ok: boolean; error?: string }> {
  const update: any = { autopay_enabled: enabled };
  if (enabled && source != null) update.autopay_source = source;
  const { error } = await supabase.from('Buildings').update(update).eq('custom_id', customId);
  return error ? { ok: false, error: error.message } : { ok: true };
}
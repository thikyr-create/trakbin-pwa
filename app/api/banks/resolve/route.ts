import { NextRequest, NextResponse } from 'next/server';
import { getProvider, DEFAULT_PROVIDER } from '@/lib/server/payments/providers';
import { supportsAccountResolution } from '@/lib/payments/types';
import { getCountry, DEFAULT_COUNTRY } from '@/lib/payments/countries';

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const bankCode = sp.get('bankCode');
  const account = sp.get('account');
  if (!bankCode || !account) return NextResponse.json({ ok: false, error: 'bankCode_and_account_required' }, { status: 400 });

  const country = getCountry(sp.get('country')) || DEFAULT_COUNTRY;
  const providerName = (sp.get('provider') as any) || country.providers[0] || DEFAULT_PROVIDER;
  const provider = getProvider(providerName);
  if (!supportsAccountResolution(provider)) {
    return NextResponse.json({ ok: false, error: 'provider_cannot_resolve_accounts' }, { status: 400 });
  }
  try {
    const resolved = await provider.resolveAccount({ bankCode, accountNumber: account, currency: country.currency });
    if (!resolved.accountName) return NextResponse.json({ ok: false, error: 'account_not_found' }, { status: 404 });
    return NextResponse.json({ ok: true, ...resolved });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || 'resolve_failed' }, { status: 502 });
  }
}
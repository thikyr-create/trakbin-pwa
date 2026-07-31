import { NextRequest, NextResponse } from 'next/server';
import { getProvider, DEFAULT_PROVIDER } from '@/lib/server/payments/providers';
import { supportsBankDirectory } from '@/lib/payments/types';
import { getCountry, DEFAULT_COUNTRY } from '@/lib/payments/countries';

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const country = getCountry(sp.get('country')) || DEFAULT_COUNTRY;
  const providerName = (sp.get('provider') as any) || country.providers[0] || DEFAULT_PROVIDER;

  const provider = getProvider(providerName);
  if (!supportsBankDirectory(provider)) {
    return NextResponse.json({ ok: false, error: 'provider_has_no_bank_directory' }, { status: 400 });
  }
  try {
    const banks = await provider.listBanks({ country: country.iso, currency: country.currency });
    return NextResponse.json({ ok: true, country: country.iso, currency: country.currency, provider: providerName, banks });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || 'list_banks_failed' }, { status: 502 });
  }
}
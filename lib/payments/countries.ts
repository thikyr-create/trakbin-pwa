// One config drives the country dropdown AND validates every request. Adding a
// market later = one entry here + the adapter's ISO→provider mapping. The API
// contract, the dropdown, the instrument model, and autopay all stay unchanged.
import type { PaymentProviderName } from './types';

export interface SupportedCountry {
  iso: string;          // ISO 3166-1 alpha-2: 'NG'
  name: string;
  currency: string;     // ISO 4217: 'NGN'
  flag: string;
  dialCode: string;
  providers: PaymentProviderName[];
}

export const SUPPORTED_COUNTRIES: SupportedCountry[] = [
  { iso: 'NG', name: 'Nigeria',      currency: 'NGN', flag: '🇳🇬', dialCode: '+234', providers: ['paystack', 'flutterwave', 'monnify', 'opay'] },
  { iso: 'GH', name: 'Ghana',        currency: 'GHS', flag: '🇬🇭', dialCode: '+233', providers: ['paystack', 'flutterwave'] },
  { iso: 'ZA', name: 'South Africa', currency: 'ZAR', flag: '🇿🇦', dialCode: '+27',  providers: ['stripe'] },
];

export const getCountry = (iso?: string | null): SupportedCountry | undefined =>
  SUPPORTED_COUNTRIES.find((c) => c.iso.toUpperCase() === String(iso || '').toUpperCase());

export const DEFAULT_COUNTRY = SUPPORTED_COUNTRIES[0];
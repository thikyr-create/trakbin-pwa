import 'server-only';
import type { PaymentProvider, PaymentProviderName } from '@/lib/payments/types';
import { paystackProvider } from './paystack';
import { flutterwaveProvider } from './flutterwave';
import { stripeProvider } from './stripe';
import { monnifyProvider } from './monnify';
import { opayProvider } from './opay';

const REGISTRY: Record<PaymentProviderName, PaymentProvider> = {
  paystack: paystackProvider,
  flutterwave: flutterwaveProvider,
  stripe: stripeProvider,
  monnify: monnifyProvider,
  opay: opayProvider,
};

export function getProvider(name: PaymentProviderName): PaymentProvider {
  const p = REGISTRY[name];
  if (!p) throw new Error(`Unknown payment provider: ${name}`);
  return p;
}

export const DEFAULT_PROVIDER: PaymentProviderName =
  (process.env.DEFAULT_PAYMENT_PROVIDER as PaymentProviderName) || 'paystack';
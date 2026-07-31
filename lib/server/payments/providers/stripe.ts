import 'server-only';
import type { PaymentProvider } from '@/lib/payments/types';
const NYI = 'Stripe adapter ships when Trakbin goes international (Sprint 6.4+).';
export const stripeProvider: PaymentProvider = {
  name: 'stripe',
  async initialize() { throw new Error(NYI); },
  async verify() { throw new Error(NYI); },
  async refund() { throw new Error(NYI); },
};
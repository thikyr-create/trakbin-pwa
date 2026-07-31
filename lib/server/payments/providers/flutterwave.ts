import 'server-only';
import type { PaymentProvider } from '@/lib/payments/types';
const NYI = 'Flutterwave adapter ships in Sprint 6.4 — the engine is unaffected.';
export const flutterwaveProvider: PaymentProvider = {
  name: 'flutterwave',
  async initialize() { throw new Error(NYI); },
  async verify() { throw new Error(NYI); },
  async refund() { throw new Error(NYI); },
};
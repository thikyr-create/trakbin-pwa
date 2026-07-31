import 'server-only';
import type { PaymentProvider } from '@/lib/payments/types';
const NYI = 'OPay adapter ships in Sprint 6.4.';
export const opayProvider: PaymentProvider = {
  name: 'opay',
  async initialize() { throw new Error(NYI); },
  async verify() { throw new Error(NYI); },
  async refund() { throw new Error(NYI); },
};
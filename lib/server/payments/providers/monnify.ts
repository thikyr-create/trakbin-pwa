import 'server-only';
import type { PaymentProvider } from '@/lib/payments/types';
const NYI = 'Monnify adapter ships in Sprint 6.4.';
export const monnifyProvider: PaymentProvider = {
  name: 'monnify',
  async initialize() { throw new Error(NYI); },
  async verify() { throw new Error(NYI); },
  async refund() { throw new Error(NYI); },
};
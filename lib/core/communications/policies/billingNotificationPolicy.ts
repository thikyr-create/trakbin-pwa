// lib/core/communications/policies/billingNotificationPolicy.ts
import { emailPolicy } from './emailPolicy';

/** Billing emails respect company opt-out — except payment failures (dunning is critical). */
const ALWAYS_SEND = new Set(['PAYMENT_FAILED', 'BILLING_REMINDER_DUE']);

export const billingNotificationPolicy = {
  async gate(companyId: number, event: string): Promise<{ allow: boolean; reason?: string }> {
    if (ALWAYS_SEND.has(event)) return { allow: true };
    return emailPolicy.gate(companyId, event);
  },
};
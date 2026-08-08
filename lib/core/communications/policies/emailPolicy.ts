// lib/core/communications/policies/emailPolicy.ts
import { notificationPolicy } from './notificationPolicy';

export const emailPolicy = {
  async gate(companyId: number, event: string): Promise<{ allow: boolean; reason?: string }> {
    if (!companyId) return { allow: true };   // non-company emails (caretaker etc.) always allowed
    const ok = await notificationPolicy.shouldSend(companyId, event);
    return ok ? { allow: true } : { allow: false, reason: 'company_opt_out' };
  },
};
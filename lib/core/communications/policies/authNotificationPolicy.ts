// lib/core/communications/policies/authNotificationPolicy.ts
import { emailPolicy } from './emailPolicy';

/** Auth emails (OTP, password reset, 2FA) bypass company opt-outs — they're critical. */
export const authNotificationPolicy = {
  async gate(companyId: number, event: string): Promise<{ allow: true }> {
    // Auth events are always allowed regardless of company prefs.
    return { allow: true };
  },
};
// lib/core/communications/security/tokenPolicy.ts
import { randomBytes } from 'crypto';

export const tokenPolicy = {
  /** Password reset token — URL-safe base64, 1h TTL */
  passwordReset: { ttlMinutes: 60, bytes: 32 },
  /** Email verification token */
  emailVerify: { ttlMinutes: 60 * 24, bytes: 32 },
  /** Account recovery — non-reusable code set */
  recovery: { count: 8, bytes: 6 },

  generate(bytes: number): string {
    return randomBytes(bytes).toString('base64url');
  },
};
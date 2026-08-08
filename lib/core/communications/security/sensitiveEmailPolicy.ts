// lib/core/communications/security/sensitiveEmailPolicy.ts
import { redaction } from './redaction';

/** Log an email event without leaking the sensitive payload. */
export function logSensitiveEmail(event: string, to: string, otp?: string, token?: string): void {
  const payload: Record<string, string> = { event, to: redaction.email(to) };
  if (otp) payload.otp = redaction.otp(otp);
  if (token) payload.token = redaction.token(token);
  console.info('[communications/sensitive]', payload);
}
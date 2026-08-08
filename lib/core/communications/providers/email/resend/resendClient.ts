// lib/core/communications/providers/email/resend/resendClient.ts
import { Resend } from 'resend';
import { communicationConfig } from '../../../config/communicationConfig';
import { ProviderError } from '../../../errors';

let client: Resend | null = null;

export function getResendClient(): Resend | null {
  if (communicationConfig.dryRun) return null;
  if (!client) {
    const key = communicationConfig.resendApiKey;
    if (!key) return null;
    client = new Resend(key);
  }
  return client;
}

export function assertResend(): Resend {
  const c = getResendClient();
  if (!c) throw new ProviderError('Resend client not initialized (RESEND_API_KEY missing)', 500);
  return c;
}
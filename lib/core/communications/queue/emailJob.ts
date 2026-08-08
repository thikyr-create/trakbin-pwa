// lib/core/communications/queue/emailJob.ts
import type { EmailSendRequest } from '../channels/email';

export interface EmailJob {
  id: string;                  // idempotency key
  event: string;               // which event triggered it
  request: EmailSendRequest;
  attempts: number;
  maxAttempts: number;
  nextAttemptAt: string;       // ISO
  status: 'pending' | 'sending' | 'sent' | 'failed' | 'abandoned';
  lastError?: string | null;
  createdAt: string;
  sentAt?: string | null;
  providerMessageId?: string | null;
}
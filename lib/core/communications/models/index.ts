// lib/core/communications/models/index.ts
export type DeliveryStatus =
  | 'pending' | 'queued' | 'sending' | 'sent' | 'delivered'
  | 'bounced' | 'failed' | 'dry_run';

export interface EmailRecipient {
  email: string;
  name?: string;
}

export interface EmailAttachment {
  filename: string;
  content: string | Buffer;     // base64 or Buffer
  contentType?: string;
}

export interface EmailMessage {
  to: EmailRecipient[];
  subject: string;
  html: string;
  text?: string;
  from?: { email: string; name?: string };
  replyTo?: string;
  attachments?: EmailAttachment[];
  headers?: Record<string, string>;
}

export interface DeliveryRecord {
  id: string;                    // provider's message id (e.g. Resend's)
  status: DeliveryStatus;
  sentAt: string;                // ISO
  provider: string;              // 'resend' | 'postmark' | ...
  errorMessage?: string;
}

export interface Notification {
  id: string;                    // local idempotency key
  event: string;
  channel: 'email' | 'in_app' | 'push';
  recipient: EmailRecipient;
  context: Record<string, unknown>;
  status: DeliveryStatus;
  createdAt: string;
}
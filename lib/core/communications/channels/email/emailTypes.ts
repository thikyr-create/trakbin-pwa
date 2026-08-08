// lib/core/communications/channels/email/emailTypes.ts
export interface EmailSendRequest {
  to: { email: string; name?: string };
  subject: string;
  html: string;
  text?: string;
  from?: { email: string; name?: string };
  replyTo?: string;
  idempotencyKey?: string;
}
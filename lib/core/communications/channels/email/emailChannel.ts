// lib/core/communications/channels/email/emailChannel.ts
import type { EmailProvider } from '../../providers';
import type { DeliveryRecord } from '../../models';
import type { EmailSendRequest } from './emailTypes';
import { buildEmailMessage } from './emailMessage';
import { ResendProvider } from '../../providers/email/resend';

/**
 * EmailChannel is the only thing the engine calls.
 * Swap the provider here when you migrate from Resend to Postmark/etc.
 */
export class EmailChannel {
  constructor(private provider: EmailProvider = new ResendProvider()) {}

  async send(req: EmailSendRequest): Promise<DeliveryRecord> {
    const message = buildEmailMessage(req);
    return this.provider.send(message);
  }
}

// Singleton for easy import from anywhere
export const emailChannel = new EmailChannel();
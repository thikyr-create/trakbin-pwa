// lib/core/communications/providers/email/emailProvider.ts
import type { EmailMessage, DeliveryRecord } from '../../models';

export interface EmailProvider {
  readonly name: string;
  send(message: EmailMessage): Promise<DeliveryRecord>;
}
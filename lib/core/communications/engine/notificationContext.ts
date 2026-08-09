// lib/core/communications/engine/notificationContext.ts
import type { EmailRecipient } from '../models';

export interface NotificationContext {
  event: string;
  companyId: number | null;
  recipient: EmailRecipient;
  data: Record<string, any>;
}

export function buildNotificationContext(
  event: string,
  companyId: number | null,
  recipient: EmailRecipient,
  data: Record<string, any> = {}
): NotificationContext {
  return { event, companyId, recipient, data };
}
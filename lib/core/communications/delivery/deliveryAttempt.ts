// lib/core/communications/delivery/deliveryAttempt.ts
import type { DeliveryStatus } from './deliveryStatus';

export interface DeliveryAttempt {
  id: string;
  providerMessageId: string;
  event: string;
  recipient: string;
  status: DeliveryStatus;
  occurredAt: string;
  raw?: unknown;
}
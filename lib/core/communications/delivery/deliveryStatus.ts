// lib/core/communications/delivery/deliveryStatus.ts
export type DeliveryStatus =
  | 'queued' | 'sending' | 'sent' | 'delivered' | 'opened' | 'clicked'
  | 'bounced' | 'complained' | 'failed' | 'dry_run';
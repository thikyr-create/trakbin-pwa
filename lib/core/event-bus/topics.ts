// lib/core/event-bus/topics.ts
export const TOPICS = {
  ORGANIZATION_CREATED: 'organization.created',
  SUBSCRIPTION_CREATED: 'subscription.created',
  SUBSCRIPTION_RENEWED: 'subscription.renewed',
  SUBSCRIPTION_CANCELLED: 'subscription.cancelled',
  SUBSCRIPTION_EXPIRING: 'subscription.expiring',
  SETTLEMENT_APPROVE: 'settlement.approve',
  SETTLEMENT_REJECT: 'settlement.reject',
  SETTLEMENT_COMPLETE: 'settlement.complete',
  PAYMENT_RECEIVED: 'payment.received',
  ADMIN_ACCESS: 'admin.access',
} as const;

export type PlatformTopic = (typeof TOPICS)[keyof typeof TOPICS];
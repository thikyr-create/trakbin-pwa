// lib/super-admin/types/subscription.ts (rewrite)
export type { PlanTier, Capability } from '@/lib/core/finance/subscription-engine/plans';
export type SubscriptionStatus = 'active' | 'trial' | 'expiring' | 'cancelled';
export interface Subscription {
  id: string;
  organizationId: number;
  plan: string;
  status: SubscriptionStatus;
  renewsAt: string | null;
  mrr: number;
}
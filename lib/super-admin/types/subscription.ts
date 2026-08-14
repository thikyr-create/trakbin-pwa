// lib/super-admin/types/subscription.ts
export type PlanTier = 'starter' | 'professional' | 'enterprise';
export type SubscriptionStatus = 'active' | 'trial' | 'expiring' | 'cancelled';
export interface Subscription {
  id: string;
  organizationId: number;
  plan: PlanTier;
  status: SubscriptionStatus;
  renewsAt: string | null;
  mrr: number;
}
export type Capability = 'field_intelligence' | 'analytics' | 'api_access' | 'multi_zone' | 'priority_support';
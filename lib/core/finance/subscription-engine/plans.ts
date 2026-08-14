// lib/core/finance/subscription-engine/plans.ts
export type PlanTier = 'starter' | 'professional' | 'enterprise';
export type Capability = 'field_intelligence' | 'analytics' | 'api_access' | 'multi_zone' | 'priority_support';

export interface PlanDefinition {
  tier: PlanTier;
  name: string;
  monthlyFee: number;
  capabilities: Capability[];
  support: string;
}

// Plans NEVER limit volume (properties, zones, users, drivers).
// They differentiate on capabilities + support level only.
export const PLANS: Record<PlanTier, PlanDefinition> = {
  starter: {
    tier: 'starter', name: 'Starter', monthlyFee: 25000,
    capabilities: ['analytics'], support: 'standard',
  },
  professional: {
    tier: 'professional', name: 'Professional', monthlyFee: 75000,
    capabilities: ['analytics', 'field_intelligence', 'multi_zone'], support: 'priority',
  },
  enterprise: {
    tier: 'enterprise', name: 'Enterprise', monthlyFee: 250000,
    capabilities: ['analytics', 'field_intelligence', 'multi_zone', 'api_access', 'priority_support'],
    support: 'dedicated',
  },
};

export const PLAN_LIST: PlanDefinition[] = [PLANS.starter, PLANS.professional, PLANS.enterprise];
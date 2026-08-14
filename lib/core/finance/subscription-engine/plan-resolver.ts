// lib/core/finance/subscription-engine/plan-resolver.ts
import { PLANS, PLAN_LIST, type PlanDefinition, type PlanTier } from './plans';

export function resolvePlan(tier: string | null | undefined): PlanDefinition {
  return PLANS[(tier as PlanTier) || 'starter'] || PLANS.starter;
}
export function allPlans(): PlanDefinition[] {
  return PLAN_LIST;
}
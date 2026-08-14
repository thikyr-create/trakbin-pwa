// lib/super-admin/config/plans.ts
// Console view of platform truth — the engine owns the definitions
export { PLANS, PLAN_LIST } from '@/lib/core/finance/subscription-engine/plans';
export { resolvePlan, allPlans } from '@/lib/core/finance/subscription-engine/plan-resolver';
export type { PlanDefinition, PlanTier, Capability } from '@/lib/core/finance/subscription-engine/plans';
// lib/core/finance/subscription-engine/entitlement-resolver.ts
import type { SupabaseClient } from '@supabase/supabase-js';
import { resolvePlan } from './plan-resolver';
import type { Capability, PlanDefinition } from './plans';

export function canPlanAccess(plan: PlanDefinition, cap: Capability): boolean {
  return plan.capabilities.includes(cap);
}

// The ONLY way feature gates should be written anywhere in Trakbin:
//   canOrganizationAccess(client, orgId, 'field_intelligence')
// Never: if (company.plan === 'pro')
export async function canOrganizationAccess(client: SupabaseClient, companyId: number, cap: Capability): Promise<boolean> {
  const { data } = await client
    .from('subscriptions')
    .select('plan, status')
    .eq('company_id', companyId)
    .in('status', ['active', 'trial'])
    .maybeSingle();
  if (!data) return false; // no live subscription → no entitlements
  return canPlanAccess(resolvePlan(data.plan), cap);
}
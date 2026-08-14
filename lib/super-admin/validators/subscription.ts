// lib/super-admin/validators/subscription.ts
import { PLANS } from '@/lib/core/finance/subscription-engine/plans';
export function validatePlanTier(v: unknown): { ok: boolean; value?: keyof typeof PLANS; error?: string } {
  if (typeof v === 'string' && (v as any) in PLANS) return { ok: true, value: v as keyof typeof PLANS };
  return { ok: false, error: 'Unknown plan tier' };
}
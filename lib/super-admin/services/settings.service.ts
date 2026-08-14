// lib/super-admin/services/settings.service.ts
import { adminSupabase as supabase } from '../supabase/client';

export interface PlatformConfig {
  commissionBps: number;
  tiers: { auto: number; review: number };
  flags: { announcements: boolean; subscriptions: boolean; field_intelligence: boolean };
  defaults: { currency: string; symbol: string; timezone: string; billing_day: number };
}

export const DEFAULT_CONFIG: PlatformConfig = {
  commissionBps: 1000,
  tiers: { auto: 500000, review: 5000000 },
  flags: { announcements: true, subscriptions: true, field_intelligence: true },
  defaults: { currency: 'NGN', symbol: '₦', timezone: 'Africa/Lagos', billing_day: 1 },
};

export async function getConfig(): Promise<PlatformConfig> {
  const { data } = await supabase.from('platform_config').select('*');
  const rows = new Map((data || []).map((r: any) => [r.key, r.value || {}]));
  const commission = rows.get('commission') || {};
  const tiers = rows.get('settlement_tiers') || {};
  const flags = rows.get('feature_flags') || {};
  const defaults = rows.get('defaults') || {};
  return {
    commissionBps: Number(commission.bps ?? DEFAULT_CONFIG.commissionBps),
    tiers: {
      auto: Number(tiers.auto ?? DEFAULT_CONFIG.tiers.auto),
      review: Number(tiers.review ?? DEFAULT_CONFIG.tiers.review),
    },
    flags: { ...DEFAULT_CONFIG.flags, ...flags },
    defaults: { ...DEFAULT_CONFIG.defaults, ...defaults },
  };
}

export async function saveConfig(patch: Partial<PlatformConfig>, actorId?: string | null) {
  const writes: { key: string; value: any }[] = [];
  if (patch.commissionBps != null) writes.push({ key: 'commission', value: { bps: patch.commissionBps } });
  if (patch.tiers) writes.push({ key: 'settlement_tiers', value: patch.tiers });
  if (patch.flags) writes.push({ key: 'feature_flags', value: patch.flags });
  if (patch.defaults) writes.push({ key: 'defaults', value: patch.defaults });
  for (const w of writes) {
    const { error } = await supabase
      .from('platform_config')
      .upsert({ key: w.key, value: w.value, updated_at: new Date().toISOString(), updated_by: actorId ?? null });
    if (error) throw new Error(error.message);
  }
}
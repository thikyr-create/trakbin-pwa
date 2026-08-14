// lib/core/finance/settlement-engine/rules.ts
export interface SettlementRules { auto: number; review: number }
export type SettlementClass = 'auto' | 'review' | 'enhanced';

export const DEFAULT_RULES: SettlementRules = { auto: 500000, review: 5000000 };

// Pure — rules come from platform_config, never from UI
export function classifySettlement(rules: SettlementRules, amount: number): SettlementClass {
  if (amount <= rules.auto) return 'auto';
  if (amount <= rules.review) return 'review';
  return 'enhanced';
}
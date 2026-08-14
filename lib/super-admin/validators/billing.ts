// lib/super-admin/validators/billing.ts
export function validateCommissionBps(v: unknown): { ok: boolean; value?: number; error?: string } {
  const n = Number(v);
  if (!Number.isInteger(n) || n < 0 || n > 5000) return { ok: false, error: 'Commission must be 0–5000 bps' };
  return { ok: true, value: n };
}

export function validateSettlementTiers(t: { auto: number; review: number }): { ok: boolean; error?: string } {
  if (!(t.auto > 0)) return { ok: false, error: 'Auto tier must be positive' };
  if (!(t.review > t.auto)) return { ok: false, error: 'Review tier must exceed auto tier' };
  return { ok: true };
}
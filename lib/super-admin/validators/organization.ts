// lib/super-admin/validators/organization.ts
export function validateOrganizationId(v: unknown): { ok: boolean; value?: number; error?: string } {
  const n = Number(v);
  if (!Number.isInteger(n) || n <= 0) return { ok: false, error: 'Organization ID must be a positive integer' };
  return { ok: true, value: n };
}
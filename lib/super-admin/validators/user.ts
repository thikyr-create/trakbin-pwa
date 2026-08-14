// lib/super-admin/validators/user.ts
import { PLATFORM_ROLES } from '../config/permissions';
export function validatePlatformRole(v: unknown): { ok: boolean; value?: string; error?: string } {
  if (v === null) return { ok: true, value: null as any };
  if (typeof v === 'string' && (PLATFORM_ROLES as string[]).includes(v)) return { ok: true, value: v };
  return { ok: false, error: 'Unknown platform role' };
}
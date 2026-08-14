// lib/super-admin/types/user.ts
export type PlatformRole =
  | 'SUPER_ADMIN' | 'PLATFORM_ADMIN' | 'PLATFORM_FINANCE'
  | 'PLATFORM_SUPPORT' | 'PLATFORM_ANALYST';
export interface PlatformUser {
  id: string;
  email: string | null;
  role: PlatformRole;
  organizationId: number | null;
  suspended: boolean;
}
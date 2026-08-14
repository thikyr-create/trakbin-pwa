// lib/super-admin/config/permissions.ts
import type { PlatformRole } from '../types/user';

export const PLATFORM_ROLES: PlatformRole[] = [
  'SUPER_ADMIN', 'PLATFORM_ADMIN', 'PLATFORM_FINANCE', 'PLATFORM_SUPPORT', 'PLATFORM_ANALYST',
];

export type PlatformCapability =
  | 'view:overview' | 'view:organizations' | 'manage:organizations'
  | 'view:billing' | 'act:settlements' | 'manage:billing'
  | 'view:users' | 'manage:users' | 'manage:roles'
  | 'view:audit' | 'view:health' | 'manage:settings'
  | 'act:approvals' | 'send:communications';

// Least privilege: nobody gets SUPER_ADMIN by default
const MATRIX: Record<PlatformRole, PlatformCapability[]> = {
  SUPER_ADMIN: ['view:overview','view:organizations','manage:organizations','view:billing','act:settlements','manage:billing','view:users','manage:users','manage:roles','view:audit','view:health','manage:settings','act:approvals','send:communications'],
  PLATFORM_ADMIN: ['view:overview','view:organizations','manage:organizations','view:billing','act:settlements','view:users','manage:users','view:audit','view:health','act:approvals','send:communications'],
  PLATFORM_FINANCE: ['view:overview','view:billing','act:settlements','manage:billing','view:audit'],
  PLATFORM_SUPPORT: ['view:overview','view:organizations','view:users','act:approvals','send:communications'],
  PLATFORM_ANALYST: ['view:overview','view:health'],
};

export function can(role: PlatformRole | null | undefined, cap: PlatformCapability): boolean {
  if (!role) return false;
  return (MATRIX[role] || []).includes(cap);
}
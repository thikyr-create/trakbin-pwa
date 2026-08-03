import type { Role } from './types';

export const ROLE_HOME: Record<Role, string> = {
  caretaker: '/caretaker-dashboard',
  company: '/waste-company-dashboard',
  driver: '/hauler-dashboard',
  admin: '/admin/finance',
  government: '/government-dashboard',
};

export const ROLE_LABEL: Record<Role, string> = {
  caretaker: 'Caretaker',
  company: 'Waste Company',
  driver: 'Driver',
  admin: 'Platform Admin',
  government: 'Government',
};

// capability map — AuthGuard and nav consume this; extend as features land.
const CAPS: Record<Role, string[]> = {
  caretaker: ['billing:pay', 'report:create', 'wallet:topup'],
  company: ['requests:view', 'finance:view', 'payouts:request', 'issues:view', 'zones:manage'],
  driver: ['route:execute', 'issues:create'],
  admin: ['finance:platform', 'reconcile:transfers'],
  government: ['oversight:view'],
};

export function can(role: Role | null | undefined, capability: string): boolean {
  if (!role) return false;
  return (CAPS[role] || []).includes(capability);
}
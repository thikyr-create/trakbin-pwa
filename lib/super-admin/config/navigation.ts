// lib/super-admin/config/navigation.ts
import {
  LayoutGrid, Building2, Network, Eye, Crown, Receipt, Mail,
  CheckSquare, Users, BarChart3, Activity, Shield, Settings,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export interface AdminNavItem {
  key: string;
  label: string;
  href: string;
  Icon: LucideIcon;
}

// The Super Admin's 13 surfaces — order is information hierarchy, not alphabet
export const ADMIN_NAV: AdminNavItem[] = [
  { key: 'overview',     label: 'Overview',           href: '/admin',                    Icon: LayoutGrid },
  { key: 'organizations',label: 'Organizations',      href: '/admin/organizations',      Icon: Building2 },
  { key: 'network',      label: 'Network',            href: '/admin/network',            Icon: Network },
  { key: 'field',        label: 'Field Intelligence', href: '/admin/field-intelligence', Icon: Eye },
  { key: 'subscriptions',label: 'Subscriptions',      href: '/admin/subscriptions',      Icon: Crown },
  { key: 'billing',      label: 'Platform Billing',   href: '/admin/billing',            Icon: Receipt },
  { key: 'comms',        label: 'Communications',     href: '/admin/communications',     Icon: Mail },
  { key: 'approvals',    label: 'Approvals',          href: '/admin/approvals',          Icon: CheckSquare },
  { key: 'users',        label: 'Users & Access',     href: '/admin/users',              Icon: Users },
  { key: 'analytics',    label: 'Analytics',          href: '/admin/analytics',          Icon: BarChart3 },
  { key: 'health',       label: 'Platform Health',    href: '/admin/health',             Icon: Activity },
  { key: 'audit',        label: 'Audit & Governance', href: '/admin/audit',              Icon: Shield },
  { key: 'settings',     label: 'Settings',           href: '/admin/settings',           Icon: Settings },
];
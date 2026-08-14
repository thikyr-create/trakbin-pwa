// lib/super-admin/types/analytics.ts
import type { RevenueSnapshot } from './billing';
export interface PlatformOverview {
  organizations: number;
  activeSubscriptions: number;
  mrr: number;
  outstandingPlatformInvoices: number;
  properties: number;
  zones: number;
  activeOperators: number;
  activeDrivers: number;
  collectionsProcessed: number;
  collectionsVolume: number;
  fieldObservations: number;
  platformIncidents: number;
  overdueInvoices: number;
  revenue: RevenueSnapshot;
}
export interface AttentionItem { id: string; label: string; href: string; tone: 'amber' | 'rose' | 'blue'; }
export interface ActivityEvent { id: string; kind: 'payment' | 'ledger' | 'request'; label: string; at: string; }
// lib/super-admin/types/billing.ts
export interface RevenueSnapshot {
  grossCollected: number;
  commissionRetained: number;
  operatorPayable: number;
  settledOut: number;
}
export interface PlatformEventMap {
  BUILDING_REGISTERED: { buildingId: string };
  BUILDING_UPDATED: { buildingId?: string };
  ZONE_CREATED: { companyId: number; zoneId?: string };
  ZONE_UPDATED: { zoneId?: string; companyId?: number };
  ZONE_DELETED: { zoneId?: string };
  ASSIGNMENT_CREATED: { buildingId: string; companyId: number; zoneName?: string | null };
  ASSIGNMENT_UPDATED: { buildingId?: string; companyId?: number };
  SERVICE_REQUESTED: { buildingId: string };
  SERVICE_ACTIVATED: { buildingId: string; companyId: number };
  PAYMENT_RECEIVED: { buildingId: string; companyId: number | null };
  INVOICE_SETTLED: { buildingId: string; companyId: number | null };
  PAYOUT_RELEASED: { companyId: number; amount: number };
  USER_REGISTERED: { userId: string; role: string };
  CARETAKER_AUTHENTICATED: { buildingId: string };
  ROUTE_GENERATED: { routeId: string; companyId: number };
  ROUTE_COMPLETED: { routeId: string; companyId: number };
}
export type PlatformEventType = keyof PlatformEventMap;
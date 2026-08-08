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
  // Append to the existing PlatformEventMap:
  // Driver events (from features/driver/activity)
  DRIVER_ROUTE_STARTED: { driverId: string; routeId: string; companyId: number };
  DRIVER_STOP_APPROACHED: { driverId: string; buildingId: string; companyId: number; distanceM: number };
  DRIVER_STOP_ARRIVED: { driverId: string; buildingId: string; companyId: number };
  DRIVER_PICKUP_CONFIRMED: { driverId: string; buildingId: string; companyId: number };
  DRIVER_PICKUP_SKIPPED: { driverId: string; buildingId: string; companyId: number; reason: string };
  DRIVER_PICKUP_FAILED: { driverId: string; buildingId: string; companyId: number; reason: string };
  DRIVER_DEVIATED: { driverId: string; companyId: number; distanceM: number };
  DRIVER_REJOINED_ROUTE: { driverId: string; companyId: number };
  DRIVER_FEEDBACK_SUBMITTED: { driverId: string; buildingId?: string | null; companyId: number; category: string };
  DRIVER_LOCATION_CORRECTED: { driverId: string; buildingId: string; companyId: number };
  DRIVER_ROUTE_COMPLETED: { driverId: string; routeId: string; companyId: number };
  DRIVER_ROUTE_PAUSED: { driverId: string; routeId: string; companyId: number };
  DRIVER_ROUTE_RESUMED: { driverId: string; routeId: string; companyId: number };
}
export type PlatformEventType = keyof PlatformEventMap;
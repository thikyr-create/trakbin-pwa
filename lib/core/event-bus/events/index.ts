// lib/core/event-bus/events/index.ts

/**
 * PlatformEventMap: the master registry of every first-class event in Trakbin.
 * Any engine that publishes must define its payload shape here.
 */
export interface PlatformEventMap {
  // ── Building lifecycle ──
  BUILDING_REGISTERED: { buildingId: string };
  BUILDING_ONBOARDED: { buildingId: string; companyId: number };
  BUILDING_LOCATION_CORRECTED: { buildingId: string; companyId: number; latitude: number; longitude: number };
  BUILDING_STATUS_CHANGED: { buildingId: string; companyId: number; status: string };
  BUILDING_ARCHIVED: { buildingId: string; companyId: number };

   // Service lifecycle
  SERVICE_ACTIVATED: { buildingId: string; companyId: number };
  SERVICE_DEACTIVATED: { buildingId: string; companyId: number };

  // Assignment events
  ASSIGNMENT_UPDATED: { buildingId: string; companyId: number };

  // ── Caretaker auth ──
  CARETAKER_LOGGED_IN: { buildingId: string; companyId: number };
  CARETAKER_LOGGED_OUT: { buildingId: string; companyId: number };
  CARETAKER_PASSCODE_RESET: { buildingId: string };

  // ── Company lifecycle ──
  COMPANY_REGISTERED: { companyId: number };
  COMPANY_EMAIL_VERIFIED: { companyId: number };
  COMPANY_PROFILE_COMPLETED: { companyId: number };
  COMPANY_ONBOARDED: { companyId: number };
  COMPANY_SUSPENDED: { companyId: number; reason: string };
  COMPANY_REACTIVATED: { companyId: number };

  // ── Dispatch / VRP ──
  ROUTE_OPTIMIZED: { companyId: number; routeId: string; stops: number };
  ROUTE_DISPATCHED: { companyId: number; routeId: string; driverId: string };
  DISPATCH_FAILED: { companyId: number; reason: string };

  // ── Driver console (Phase B events) ──
  DRIVER_ROUTE_STARTED: { driverId: string; routeId: string; companyId: number };
  DRIVER_STOP_APPROACHED: { driverId: string; buildingId: string; companyId: number; distanceM: number };
  DRIVER_STOP_ARRIVED: { driverId: string; buildingId: string; companyId: number };
  DRIVER_PICKUP_CONFIRMED: { driverId: string; buildingId: string; companyId: number };
  DRIVER_PICKUP_SKIPPED: { driverId: string; buildingId: string; companyId: number; reason: string };
  DRIVER_PICKUP_FAILED: { driverId: string; buildingId: string; companyId: number; reason: string };
  DRIVER_EVIDENCE_ATTACHED: {
    driverId: string;
    buildingId?: string | null;
    companyId: number;
    evidenceUrls: string[];
    activityType: 'pickup' | 'skip' | 'report' | 'deviation';
  };
  DRIVER_DEVIATED: { driverId: string; companyId: number; distanceM: number };
  DRIVER_REJOINED_ROUTE: { driverId: string; companyId: number };
  DRIVER_FEEDBACK_SUBMITTED: { driverId: string; buildingId?: string | null; companyId: number; category: string };
  DRIVER_LOCATION_CORRECTED: { driverId: string; buildingId: string; companyId: number };
  DRIVER_ROUTE_COMPLETED: { driverId: string; routeId: string; companyId: number };
  DRIVER_ROUTE_PAUSED: { driverId: string; routeId: string; companyId: number };
  DRIVER_ROUTE_RESUMED: { driverId: string; routeId: string; companyId: number };

  // ── Field Intelligence (Phase C) ──
  FIELD_INTELLIGENCE_LEARNED: { companyId: number; source: string; sampleCount: number };
}

export type PlatformEventType = keyof PlatformEventMap;
export type PlatformEventName = PlatformEventType;
export type PlatformEventPayload<K extends PlatformEventType> = PlatformEventMap[K];
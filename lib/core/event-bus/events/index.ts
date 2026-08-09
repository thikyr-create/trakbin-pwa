// lib/core/event-bus/events/index.ts

export interface PlatformEventMap {
  // ── Building lifecycle ──
  BUILDING_REGISTERED: { buildingId: string };
  BUILDING_UPDATED: { buildingId: string; companyId: number };
  BUILDING_ONBOARDED: { buildingId: string; companyId: number };
  BUILDING_LOCATION_CORRECTED: { buildingId: string; companyId: number; latitude: number; longitude: number };
  BUILDING_STATUS_CHANGED: { buildingId: string; companyId: number; status: string };
  BUILDING_ARCHIVED: { buildingId: string; companyId: number };
  BUILDING_CREATED: { buildingId: string; companyId: number };
  BUILDING_DELETED: { buildingId: string; companyId: number };

  // ── Service lifecycle ──
  SERVICE_ACTIVATED: { buildingId: string; companyId: number };
  SERVICE_DEACTIVATED: { buildingId: string; companyId: number };
  SERVICE_CREATED: { buildingId: string; companyId: number };
  SERVICE_UPDATED: { buildingId: string; companyId: number };
  SERVICE_DELETED: { buildingId: string; companyId: number };

  // ── Assignment events ──
  ASSIGNMENT_UPDATED: { buildingId: string; companyId: number };
  ASSIGNMENT_CREATED: { buildingId: string; companyId: number };
  ASSIGNMENT_DELETED: { buildingId: string; companyId: number };

  // ── Zone lifecycle ──
  ZONE_CREATED: { zoneId: string; companyId: number };
  ZONE_UPDATED: { zoneId: string; companyId: number };
  ZONE_DELETED: { zoneId: string; companyId: number };

  // ── Truck lifecycle ──
  TRUCK_CREATED: { truckId: string; companyId: number };
  TRUCK_UPDATED: { truckId: string; companyId: number };
  TRUCK_DELETED: { truckId: string; companyId: number };

  // ── Driver lifecycle ──
  DRIVER_CREATED: { driverId: string; companyId: number };
  DRIVER_UPDATED: { driverId: string; companyId: number };
  DRIVER_DELETED: { driverId: string; companyId: number };
  DRIVER_ASSIGNED: { driverId: string; routeId: string; companyId: number };

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
  COMPANY_UPDATED: { companyId: number };

  // ── User lifecycle ──
  USER_REGISTERED: { userId: string; role: string };

  // ── Dispatch / VRP ──
  ROUTE_OPTIMIZED: { companyId: number; routeId: string; stops: number };
  ROUTE_DISPATCHED: { companyId: number; routeId: string; driverId: string };
  ROUTE_CREATED: { companyId: number; routeId: string };
  ROUTE_UPDATED: { companyId: number; routeId: string };
  ROUTE_DELETED: { companyId: number; routeId: string };
  ROUTE_ASSIGNED: { companyId: number; routeId: string; driverId: string };
  ROUTE_GENERATED: { companyId: number; routeId: string };
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

  // ── Operations events ──
  INCIDENT_REPORTED: { incidentId: string; companyId: number; type: string };
  REPORT_CREATED: { reportId: string; companyId: number; type: string };
  PICKUP_COMPLETED: { pickupId: string; companyId: number; buildingId: string };
  OPS_INCIDENT_REPORTED: { incidentId: string; companyId: number };
  OPS_PICKUP_COMPLETED: { pickupId: string; companyId: number };
  OPS_ROUTE_ASSIGNED: { routeId: string; companyId: number };

  // ── Billing events ──
  BILLING_INVOICE_CREATED: { invoiceId: string; companyId: number; amount: number };
  BILLING_PAYMENT_RECEIVED: { paymentId: string; companyId: number; amount: number };
  BILLING_REMINDER_DUE: { invoiceId: string; companyId: number };
  INVOICE_CREATED: { invoiceId: string; companyId: number };
  PAYMENT_RECEIVED: { paymentId: string; companyId: number };
  PAYMENT_FAILED: { paymentId: string; companyId: number; reason: string };
  PAYOUT_RELEASED: { payoutId: string; companyId: number; amount: number };

  // ── Auth email events ──
  AUTH_2FA_ENROLLED: { userId: string };
  AUTH_ACCOUNT_RECOVERY_REQUESTED: { userId: string };
  AUTH_DRIVER_CREDENTIALS_SENT: { driverId: string; companyId: number };
  AUTH_EMAIL_VERIFICATION_REQUESTED: { userId: string };
  AUTH_NEW_LOGIN: { userId: string };
  AUTH_OTP_REQUESTED: { userId: string };
  AUTH_PASSWORD_CHANGED: { userId: string };
  AUTH_PASSWORD_RESET_REQUESTED: { userId: string };
  AUTH_SECURITY_ALERT: { userId: string; alertType: string };
  AUTH_WELCOME_SENT: { userId: string; role: string };

  // ── Field Intelligence (Phase C) ──
  FIELD_INTELLIGENCE_LEARNED: { companyId: number; source: string; sampleCount: number };
}

export type PlatformEventType = keyof PlatformEventMap;
export type PlatformEventName = PlatformEventType;
export type PlatformEventPayload<K extends PlatformEventType> = PlatformEventMap[K];
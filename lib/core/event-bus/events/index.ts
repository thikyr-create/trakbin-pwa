// lib/core/event-bus/events/index.ts

/**
 * PlatformEventMap — master registry of every first-class event in Trakbin.
 *
 * Payload fields are OPTIONAL by design: publishers emit whatever context they
 * have at the call site (a zone-wide change has no single buildingId, a bulk
 * assignment has no single zoneId). Subscribers read what they need.
 */
interface RawPlatformEventMap {
  // ── Building lifecycle ──
  BUILDING_REGISTERED: { buildingId?: string | null; companyId?: number| null };
  BUILDING_UPDATED: { buildingId?: string | null; companyId?: number | null };
  BUILDING_ONBOARDED: { buildingId?: string | null; companyId?: number | null };
  BUILDING_LOCATION_CORRECTED: { buildingId?: string | null; companyId?: number | null; latitude?: number | null; longitude?: number | null };
  BUILDING_STATUS_CHANGED: { buildingId?: string | null; companyId?: number | null; status?: string | null };
  BUILDING_ARCHIVED: { buildingId?: string | null; companyId?: number |null };
  BUILDING_CREATED: { buildingId?: string | null; companyId?: number | null };
  BUILDING_DELETED: { buildingId?: string | null; companyId?: number | null };

  // ── Service lifecycle ──
  SERVICE_ACTIVATED: { buildingId?: string | null; companyId?: number |null };
  SERVICE_DEACTIVATED: { buildingId?: string | null; companyId?: number| null };
  SERVICE_CREATED: { buildingId?: string | null; companyId?: number | null };
  SERVICE_UPDATED: { buildingId?: string | null; companyId?: number | null };
  SERVICE_DELETED: { buildingId?: string | null; companyId?: number | null };

  // ── Assignment events ──
  ASSIGNMENT_UPDATED: { buildingId?: string | null; companyId?: number | null };
  ASSIGNMENT_CREATED: { buildingId?: string | null; companyId?: number | null };
  ASSIGNMENT_DELETED: { buildingId?: string | null; companyId?: number | null };

  // ── Zone lifecycle ──
  ZONE_CREATED: { zoneId?: string | null; companyId?: number | null };
  ZONE_UPDATED: { zoneId?: string | null; companyId?: number | null };
  ZONE_DELETED: { zoneId?: string | null; companyId?: number | null };

  // ── Truck lifecycle ──
  TRUCK_CREATED: { truckId?: string | null; companyId?: number | null };
  TRUCK_UPDATED: { truckId?: string | null; companyId?: number | null };
  TRUCK_DELETED: { truckId?: string | null; companyId?: number | null };

  // ── Driver lifecycle ──
  DRIVER_CREATED: { driverId?: string | null; companyId?: number | null};
  DRIVER_UPDATED: { driverId?: string | null; companyId?: number | null};
  DRIVER_DELETED: { driverId?: string | null; companyId?: number | null};
  DRIVER_ASSIGNED: { driverId?: string | null; routeId?: string | null;companyId?: number | null };

  // ── Caretaker auth ──
  CARETAKER_LOGGED_IN: { buildingId?: string | null; companyId?: number| null };
  CARETAKER_LOGGED_OUT: { buildingId?: string | null; companyId?: number | null };
  CARETAKER_PASSCODE_RESET: { buildingId?: string | null };

  // ── Company lifecycle ──
  COMPANY_REGISTERED: { companyId?: number | null };
  COMPANY_EMAIL_VERIFIED: { companyId?: number | null };
  COMPANY_PROFILE_COMPLETED: { companyId?: number | null };
  COMPANY_ONBOARDED: { companyId?: number | null };
  COMPANY_SUSPENDED: { companyId?: number | null; reason?: string | null };
  COMPANY_REACTIVATED: { companyId?: number | null };
  COMPANY_UPDATED: { companyId?: number | null };

  // ── User lifecycle ──
  USER_REGISTERED: { userId?: string | null; role?: string | null };

  // ── Dispatch / VRP ──
  ROUTE_OPTIMIZED: { companyId?: number | null; routeId?: string | null; stops?: number | null };
  ROUTE_DISPATCHED: { companyId?: number | null; routeId?: string | null; driverId?: string | null };
  ROUTE_CREATED: { companyId?: number | null; routeId?: string | null };
  ROUTE_UPDATED: { companyId?: number | null; routeId?: string | null };
  ROUTE_DELETED: { companyId?: number | null; routeId?: string | null };
  ROUTE_ASSIGNED: { companyId?: number | null; routeId?: string | null;driverId?: string | null };
  ROUTE_GENERATED: { companyId?: number | null; routeId?: string | null};
  DISPATCH_FAILED: { companyId?: number | null; reason?: string | null };

  // ── Driver console (Phase B events) ──
  DRIVER_ROUTE_STARTED: { driverId?: string | null; routeId?: string | null; companyId?: number | null };
  DRIVER_STOP_APPROACHED: { driverId?: string | null; buildingId?: string | null; companyId?: number | null; distanceM?: number | null };
  DRIVER_STOP_ARRIVED: { driverId?: string | null; buildingId?: string | null; companyId?: number | null };
  DRIVER_PICKUP_CONFIRMED: { driverId?: string | null; buildingId?: string | null; companyId?: number | null };
  DRIVER_PICKUP_SKIPPED: { driverId?: string | null; buildingId?: string | null; companyId?: number | null; reason?: string | null };
  DRIVER_PICKUP_FAILED: { driverId?: string | null; buildingId?: string | null; companyId?: number | null; reason?: string | null };
  DRIVER_EVIDENCE_ATTACHED: {
    driverId?: string | null;
    buildingId?: string | null;
    companyId?: number | null;
    evidenceUrls?: string[];
    activityType?: 'pickup' | 'skip' | 'report' | 'deviation' | null;
  };
  DRIVER_DEVIATED: { driverId?: string | null; companyId?: number | null; distanceM?: number | null };
  DRIVER_REJOINED_ROUTE: { driverId?: string | null; companyId?: number| null };
  DRIVER_FEEDBACK_SUBMITTED: { driverId?: string | null; buildingId?: string | null; companyId?: number | null; category?: string | null };
  DRIVER_LOCATION_CORRECTED: { driverId?: string | null; buildingId?: string | null; companyId?: number | null };
  DRIVER_ROUTE_COMPLETED: { driverId?: string | null; routeId?: string | null; companyId?: number | null };
  DRIVER_ROUTE_PAUSED: { driverId?: string | null; routeId?: string | null; companyId?: number | null };
  DRIVER_ROUTE_RESUMED: { driverId?: string | null; routeId?: string | null; companyId?: number | null };

  // ── Operations events ──
  INCIDENT_REPORTED: { incidentId?: string | null; companyId?: number |null; type?: string | null };
  REPORT_CREATED: { reportId?: string | null; companyId?: number | null; type?: string | null };
  PICKUP_COMPLETED: { pickupId?: string | null; companyId?: number | null; buildingId?: string | null };
  OPS_INCIDENT_REPORTED: { incidentId?: string | null; companyId?: number | null };
  OPS_PICKUP_COMPLETED: { pickupId?: string | null; companyId?: number | null };
  OPS_ROUTE_ASSIGNED: { routeId?: string | null; companyId?: number | null };

  // ── Billing events ──
  BILLING_INVOICE_CREATED: { invoiceId?: string | null; companyId?: number | null; amount?: number | null };
  BILLING_PAYMENT_RECEIVED: { paymentId?: string | null; companyId?: number | null; amount?: number | null };
  BILLING_REMINDER_DUE: { invoiceId?: string | null; companyId?: number| null };
  INVOICE_CREATED: { invoiceId?: string | null; companyId?: number | null };
  PAYMENT_RECEIVED: { paymentId?: string | null; companyId?: number | null };
  PAYMENT_FAILED: { paymentId?: string | null; companyId?: number | null; reason?: string | null };
  PAYOUT_RELEASED: { payoutId?: string | null; companyId?: number | null; amount?: number | null };

  // ── Platform billing (Trakbin → operators) ──
  PLATFORM_INVOICE_CREATED: { invoiceId?: string | null; companyId?: number | null; amount?: number | null; period?: string | null };
  PLATFORM_INVOICE_PAID: { invoiceId?: string | null; companyId?: number | null; amount?: number | null };
  PLATFORM_INVOICE_OVERDUE: { invoiceId?: string | null; companyId?: number | null; amount?: number | null; period?: string | null };
  ADJUSTMENT_CREDIT_ADDED: { companyId?: number | null; amount?: number | null; transactionId?: string | null };

  // ── Settlement / subscription / org lifecycle ──
  SETTLEMENT_REQUESTED: { payoutId?: string | null; companyId?: number | null; amount?: number | null };
  SETTLEMENT_APPROVED: { payoutId?: string | null; companyId?: number | null; amount?: number | null };
  SETTLEMENT_REJECTED: { payoutId?: string | null; companyId?: number | null; amount?: number | null };
  SETTLEMENT_COMPLETED: { payoutId?: string | null; companyId?: number | null; amount?: number | null };
  SUBSCRIPTION_CREATED: { companyId?: number | null; plan?: string | null };
  SUBSCRIPTION_RENEWED: { companyId?: number | null; plan?: string | null };
  SUBSCRIPTION_CANCELLED: { companyId?: number | null };
  SUBSCRIPTION_EXPIRING: { companyId?: number | null };
  ORGANIZATION_CREATED: { companyId?: number | null; name?: string | null };

  // ── Auth email events ──
  AUTH_2FA_ENROLLED: { userId?: string | null };
  AUTH_ACCOUNT_RECOVERY_REQUESTED: { userId?: string | null };
  AUTH_DRIVER_CREDENTIALS_SENT: { driverId?: string | null; companyId?:number | null };
  AUTH_EMAIL_VERIFICATION_REQUESTED: { userId?: string | null };
  AUTH_NEW_LOGIN: { userId?: string | null };
  AUTH_OTP_REQUESTED: { userId?: string | null };
  AUTH_PASSWORD_CHANGED: { userId?: string | null };
  AUTH_PASSWORD_RESET_REQUESTED: { userId?: string | null };
  AUTH_SECURITY_ALERT: { userId?: string | null; alertType?: string | null };
  AUTH_WELCOME_SENT: { userId?: string | null; role?: string | null };

  // ── Field Intelligence (Phase C) ──
  FIELD_INTELLIGENCE_LEARNED: { companyId?: number | null; source?: string | null; sampleCount?: number | null };
}

export type PlatformEventMap = {
  [K in keyof RawPlatformEventMap]: RawPlatformEventMap[K] & { [key: string]: any };
};

export type PlatformEventType = keyof PlatformEventMap;
export type PlatformEventName = PlatformEventType;
export type PlatformEventPayload<K extends PlatformEventType> = PlatformEventMap[K];
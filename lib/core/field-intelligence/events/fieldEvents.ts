// lib/core/field-intelligence/events/fieldEvents.ts
export interface RawFieldEvent {
  sourceEventId: string;
  eventType: string;
  companyId: number;
  driverId: string | null;
  routeId?: string | null;
  buildingId?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  metadata: Record<string, any>;
  occurredAt: string;
}
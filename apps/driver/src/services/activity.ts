import { supabase } from './supabase';
import { offlineQueue } from './sync/queue';
import { DriverPublisher } from './events';

export type DriverEventType =
  | 'DRIVER_ROUTE_STARTED'
  | 'DRIVER_ROUTE_COMPLETED'
  | 'DRIVER_ROUTE_PAUSED'
  | 'DRIVER_ROUTE_RESUMED'
  | 'DRIVER_STOP_APPROACHED'
  | 'DRIVER_STOP_ARRIVED'
  | 'DRIVER_PICKUP_CONFIRMED'
  | 'DRIVER_PICKUP_SKIPPED'
  | 'DRIVER_FEEDBACK_SUBMITTED'
  | 'DRIVER_DEVIATED'
  | 'DRIVER_REJOINED_ROUTE';

export interface RecordInput {
  eventType: DriverEventType;
  driverId: string;
  companyId: number;
  routeId?: string | null;
  buildingId?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  accuracyM?: number | null;
  metadata?: Record<string, unknown>;
}

/** Append-only operational truth. Idempotent via client-generated key. */
export async function recordActivity(input: RecordInput): Promise<string> {
  const idempotencyKey = `${input.eventType}:${input.companyId}:${input.routeId ?? '-'}:${input.buildingId ?? '-'}:${Date.now()}:${Math.random().toString(36).slice(2, 8)}`;

  const row = {
    event_type: input.eventType,
    driver_id: input.driverId,
    company_id: input.companyId,
    route_id: input.routeId ?? null,
    building_id: input.buildingId ?? null,
    latitude: input.latitude ?? null,
    longitude: input.longitude ?? null,
    accuracy_m: input.accuracyM ?? null,
    metadata: input.metadata ?? {},
    idempotency_key: idempotencyKey,
    occurred_at: new Date().toISOString(),
  };

  // Publish to event bus first (cheap, local, immediate)
  DriverPublisher.publish(input.eventType, row);

  // Persist; on failure, queue for offline sync
  try {
    const { error } = await supabase.from('driver_activity').insert([row]);
    if (error) throw error;
  } catch {
    offlineQueue.enqueue({
      type: 'driver_activity',
      idempotencyKey,
      payload: row,
      enqueuedAt: new Date().toISOString(),
    }).catch(() => {});
  }

  return idempotencyKey;
}
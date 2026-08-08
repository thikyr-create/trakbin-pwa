// lib/features/driver/activity/activityRecorder.ts
import { createClient } from '@supabase/supabase-js';
import { DriverPublisher } from '@/lib/core/event-bus';
import { offlineQueue } from '../sync/offlineQueue';
import type { DriverEventType } from './activityEvents';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

interface RecordInput {
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
  DriverPublisher.publish(input.eventType as any, row as any);

  // Try to persist; on network/auth failure, queue for offline sync
  try {
    const { error } = await supabase.from('driver_activity').insert([row]);
    if (error) throw error;
  } catch (e) {
    offlineQueue.enqueue({
      type: 'driver_activity',
      idempotencyKey,
      payload: row,
      enqueuedAt: new Date().toISOString(),
    });
  }

  return idempotencyKey;
}
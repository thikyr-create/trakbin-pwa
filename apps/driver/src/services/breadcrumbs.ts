import { supabase } from './supabase';
import { offlineQueue } from './sync/queue';
import { calculateDistanceMeters } from './location';
import { BREADCRUMB_CONFIG } from '../constants/config';



interface BreadcrumbInput {
  driverId: string;
  companyId: number;
  routeId?: string | null;
  lat: number;
  lng: number;
  accuracy?: number | null;
  speed?: number | null;
  heading?: number | null;
}

interface BreadcrumbRecord extends BreadcrumbInput {
  recorded_at: string;
  idempotency_key: string;
}

let buffer: BreadcrumbRecord[] = [];
let lastRecorded: { lat: number; lng: number; time: number } | null = null;
let flushTimer: ReturnType<typeof setTimeout> | null = null;

const flush = async () => {
  if (buffer.length === 0) return;
  const toSend = [...buffer];
  buffer = [];
  if (flushTimer) { clearTimeout(flushTimer); flushTimer = null; }

  try {
    const { error } = await supabase.from('driver_breadcrumbs').insert(
      toSend.map((b) => ({
        driver_id: b.driverId,
        company_id: b.companyId,
        route_id: b.routeId,
        lat: b.lat,
        lng: b.lng,
        accuracy_m: b.accuracy,
        speed_mps: b.speed,
        heading: b.heading,
        recorded_at: b.recorded_at,
      }))
    );
    if (error) throw error;
  } catch {
    toSend.forEach((item) => {
      offlineQueue.enqueue({
        type: 'driver_breadcrumb',
        idempotencyKey: item.idempotency_key,
        payload: item as unknown as Record<string, unknown>,
        enqueuedAt: new Date().toISOString(),
      }).catch(() => {});
    });
  }
};

export const breadcrumbRecorder = {
  record(input: BreadcrumbInput) {
    const now = Date.now();

    // Hybrid sampling: time OR distance
    if (lastRecorded) {
      const timeDelta = now - lastRecorded.time;
      const distDelta = calculateDistanceMeters(lastRecorded.lat, lastRecorded.lng, input.lat, input.lng);
      if (timeDelta < BREADCRUMB_CONFIG.minTimeMs && distDelta < BREADCRUMB_CONFIG.minDistanceM) return;
    }

    const record: BreadcrumbRecord = {
      ...input,
      recorded_at: new Date(now).toISOString(),
      idempotency_key: `bc:${input.companyId}:${input.driverId}:${now}`,
    };

    buffer.push(record);
    lastRecorded = { lat: input.lat, lng: input.lng, time: now };

    if (buffer.length >= BREADCRUMB_CONFIG.batchSize) {
      flush();
    } else if (!flushTimer) {
      flushTimer = setTimeout(() => flush(), BREADCRUMB_CONFIG.flushIntervalMs);
    }
  },
  flush,
};
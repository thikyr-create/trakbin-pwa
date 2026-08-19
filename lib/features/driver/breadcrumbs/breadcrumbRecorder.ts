// lib/features/driver/breadcrumbs/breadcrumbRecorder.ts
import { supabaseBrowser } from '@/lib/supabaseBrowser';
import { offlineQueue } from '../sync/offlineQueue';
import { calculateDistanceInMeters } from '@/app/hauler-dashboard/utils/geo';
import { BREADCRUMB_CONFIG } from '@/app/hauler-dashboard/utils/constants';

const supabase = supabaseBrowser;

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
let flushTimer: NodeJS.Timeout | null = null;

const flush = async () => {
  if (buffer.length === 0) return;
  const toSend = [...buffer];
  buffer = [];
  if (flushTimer) { clearTimeout(flushTimer); flushTimer = null; }
  
  try {
    const { error } = await supabase.from('driver_breadcrumbs').insert(toSend.map(b => ({
      driver_id: b.driverId,
      company_id: b.companyId,
      route_id: b.routeId,
      lat: b.lat,
      lng: b.lng,
      accuracy_m: b.accuracy,
      speed_mps: b.speed,
      heading: b.heading,
      recorded_at: b.recorded_at,
    })));
    if (error) throw error;
  } catch (e) {
    console.warn('[breadcrumb-recorder] flush failed, queueing', e);
    toSend.forEach(item => {
      offlineQueue.enqueue({
        type: 'driver_breadcrumb',
        idempotencyKey: item.idempotency_key,
        payload: item as unknown as Record<string, unknown>,
        enqueuedAt: new Date().toISOString(),
      });
    });
  }
};

export const breadcrumbRecorder = {
  record(input: BreadcrumbInput) {
    const now = Date.now();
    
    // Hybrid sampling: time OR distance
    if (lastRecorded) {
      const timeDelta = now - lastRecorded.time;
      const distDelta = calculateDistanceInMeters(lastRecorded.lat, lastRecorded.lng, input.lat, input.lng);
      
      if (timeDelta < BREADCRUMB_CONFIG.minTimeMs && distDelta < BREADCRUMB_CONFIG.minDistanceM) {
        return; // Skip, haven't moved enough or enough time hasn't passed
      }
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
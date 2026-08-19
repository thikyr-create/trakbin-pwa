// lib/features/driver/sync/syncEngine.ts
import { supabaseBrowser } from '@/lib/supabaseBrowser';
import { offlineQueue } from './offlineQueue';
import type { QueuedItem } from './syncTypes';
import type { SyncStatus } from './syncTypes';

const supabase = supabaseBrowser;

let status: SyncStatus = 'idle';
let listeners: Array<(s: SyncStatus) => void> = [];

function setStatus(s: SyncStatus) {
  status = s;
  listeners.forEach((l) => { try { l(s); } catch {} });
}

async function flushOne(item: QueuedItem): Promise<boolean> {
  if (item.type === 'driver_activity') {
    const { error } = await supabase.from('driver_activity').insert([item.payload as any]);
    if (error) {
      // UNIQUE violation on idempotency_key = already persisted â†’ treat as success
      if (/duplicate key|unique/i.test(error.message)) return true;
      return false;
    }
    return true;
  }

  if (item.type === 'driver_breadcrumb') {
    // Map camelCase breadcrumb record â†’ snake_case DB columns
    const p = item.payload as any;
    const row = {
      driver_id: p.driverId,
      company_id: p.companyId,
      route_id: p.routeId ?? null,
      lat: p.lat,
      lng: p.lng,
      accuracy_m: p.accuracy ?? null,
      speed_mps: p.speed ?? null,
      heading: p.heading ?? null,
      recorded_at: p.recorded_at,
    };
    const { error } = await supabase.from('driver_breadcrumbs').insert([row]);
    if (error) {
      // No unique constraint on breadcrumbs, but treat duplicate-key-style
      // errors as success just in case; real errors surface to failed count.
      if (/duplicate key|unique/i.test(error.message)) return true;
      return false;
    }
    return true;
  }

  // Unknown type â€” drop it rather than block the queue
  return true;
}

export const syncEngine = {
  getStatus(): SyncStatus { return status; },
  subscribe(cb: (s: SyncStatus) => void) { listeners.push(cb); return () => { listeners = listeners.filter((l) => l !== cb); }; },

  async flush(): Promise<{ processed: number; failed: number }> {
    if (status === 'flushing' || typeof navigator === 'undefined' || !navigator.onLine) {
      return { processed: 0, failed: 0 };
    }
    setStatus('flushing');
    let processed = 0, failed = 0;

    // Process one at a time to keep memory stable on low-end devices
    for (;;) {
      const items = offlineQueue.list();
      if (items.length === 0) break;
      const head = items[0];
      try {
        const ok = await flushOne(head);
        if (ok) { offlineQueue.remove(head.idempotencyKey); processed++; }
        else { failed++; break; } // leave for next flush
      } catch { failed++; break; }
    }

    setStatus(offlineQueue.size() === 0 ? 'drained' : 'idle');
    return { processed, failed };
  },
};

// Kick an initial flush on app load
if (typeof window !== 'undefined') {
  syncEngine.flush().catch(() => {});
}
import { supabase } from '../supabase';
import { offlineQueue, initQueue } from './queue';
import type { QueuedItem, SyncStatus } from './types';

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
      // UNIQUE violation on idempotency_key = already persisted → success
      if (/duplicate key|unique/i.test(error.message)) return true;
      return false;
    }
    return true;
  }

  if (item.type === 'driver_breadcrumb') {
    // camelCase record → snake_case DB columns
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
      if (/duplicate key|unique/i.test(error.message)) return true;
      return false;
    }
    return true;
  }

  // Unknown type — drop rather than block the queue
  return true;
}

export const syncEngine = {
  getStatus(): SyncStatus { return status; },
  subscribe(cb: (s: SyncStatus) => void) {
    listeners.push(cb);
    return () => { listeners = listeners.filter((l) => l !== cb); };
  },

  async flush(): Promise<{ processed: number; failed: number }> {
    if (status === 'flushing') return { processed: 0, failed: 0 };
    setStatus('flushing');
    let processed = 0, failed = 0;

    // One at a time: memory-stable on low-end devices
    for (;;) {
      const items = await offlineQueue.list();
      if (items.length === 0) break;
      const head = items[0];
      try {
        const ok = await flushOne(head);
        if (ok) { await offlineQueue.remove(head.idempotencyKey); processed++; }
        else { failed++; break; }
      } catch { failed++; break; }
    }

    setStatus((await offlineQueue.size()) === 0 ? 'drained' : 'idle');
    return { processed, failed };
  },
};

// ── Auto-flush triggers ──
let started = false;
export async function startSyncEngine(): Promise<void> {
  if (started) return;
  started = true;

  await initQueue();

  // 1. Boot flush (mirrors PWA)
  syncEngine.flush().catch(() => {});

  // 2. New item enqueued → try to drain
  offlineQueue.subscribe(() => { syncEngine.flush().catch(() => {}); });

  // 3. Reconnect → flush (NetInfo if present; guarded)
  try {
    const NetInfo = require('@react-native-community/netinfo').default;
    NetInfo.addEventListener((state: any) => {
      if (state?.isConnected) syncEngine.flush().catch(() => {});
    });
  } catch { /* netinfo not linked; timer below covers it */ }

  // 4. Safety timer while queue non-empty
  setInterval(async () => {
    if ((await offlineQueue.size()) > 0) syncEngine.flush().catch(() => {});
  }, 30000);
}
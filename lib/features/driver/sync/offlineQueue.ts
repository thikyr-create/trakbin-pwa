// lib/features/driver/sync/offlineQueue.ts
import type { QueuedItem } from './syncTypes';

const STORAGE_KEY = 'trakbin_driver_sync_queue';
const MAX = 500;

let listeners: Array<() => void> = [];
const subscribe = (cb: () => void) => { listeners.push(cb); return () => { listeners = listeners.filter((l) => l !== cb); }; };
const notify = () => listeners.forEach((l) => { try { l(); } catch {} });

function load(): QueuedItem[] {
  if (typeof window === 'undefined') return [];
  try { const raw = localStorage.getItem(STORAGE_KEY); return raw ? JSON.parse(raw) : []; } catch { return []; }
}
function save(items: QueuedItem[]): void {
  if (typeof window === 'undefined') return;
  const trimmed = items.slice(-MAX);
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed)); } catch {}
}

export const offlineQueue = {
  enqueue(item: QueuedItem) {
    const q = load();
    if (q.some((x) => x.idempotencyKey === item.idempotencyKey)) return; // dedup
    q.push(item);
    save(q);
    notify();
  },
  list(): QueuedItem[] { return load(); },
  size(): number { return load().length; },
  remove(idempotencyKey: string) { save(load().filter((x) => x.idempotencyKey !== idempotencyKey)); notify(); },
  clear() { save([]); notify(); },
  subscribe,
};

// Auto-listen for connectivity changes; trigger flush on reconnect
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    // dynamic import to avoid circular init
    import('./syncEngine').then((m) => m.syncEngine.flush()).catch(() => {});
  });
}
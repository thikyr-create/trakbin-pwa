import 'server-only';

// Best-effort in-memory TTL cache. Serverless/edge may not preserve module state
// across invocations, so this is an optimization, never a correctness guarantee.
// When bank-list volume justifies it (6.4), swap this for a `banks` cache table
// refreshed on a schedule — the call sites below do not change.
interface Entry<T> { value: T; expires: number; }
const store = new Map<string, Entry<unknown>>();

export function ttlGet<T>(key: string): T | undefined {
  const e = store.get(key);
  if (!e) return undefined;
  if (e.expires < Date.now()) { store.delete(key); return undefined; }
  return e.value as T;
}
export function ttlSet<T>(key: string, value: T, ttlMs: number): void {
  store.set(key, { value, expires: Date.now() + ttlMs });
}
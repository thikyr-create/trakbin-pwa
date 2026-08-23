// lib/core/snapshot.ts
// Stale-while-revalidate paint cache.
// Snapshots are RENDER-ONLY: they make reloads paint instantly.
// Auth checks, RLS, and reconciliation always run against the real
// session + network. A snapshot can never authorize anything.

export interface SnapshotEnvelope<T> { v: number; t: number; data: T; }

const V = 1;
const MAX_AGE_MS = 24 * 60 * 60 * 1000; // ignore snapshots older than 24h

export function readSnapshot<T>(key: string): T | null {
  try {
    if (typeof window === 'undefined') return null;
    const raw = window.localStorage.getItem(key);
    if (!raw) return null;
    const env = JSON.parse(raw) as SnapshotEnvelope<T>;
    if (!env || env.v !== V || !env.data) return null;
    if (Date.now() - (env.t || 0) > MAX_AGE_MS) return null;
    return env.data;
  } catch {
    return null;
  }
}

export function writeSnapshot(key: string, data: unknown): void {
  try {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(key, JSON.stringify({ v: V, t: Date.now(), data }));
  } catch {
    // storage full/blocked — snapshot is an optimization, never a dependency
  }
}

export function clearSnapshot(key: string): void {
  try { if (typeof window !== 'undefined') window.localStorage.removeItem(key); } catch {}
}
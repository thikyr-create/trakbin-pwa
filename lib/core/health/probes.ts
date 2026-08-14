// lib/core/health/probes.ts
import type { SupabaseClient } from '@supabase/supabase-js';

export interface ProbeResult {
  name: string;
  status: 'healthy' | 'degraded' | 'down' | 'unconfigured';
  latencyMs: number;
  detail: string;
}

async function time(fn: () => Promise<void>): Promise<number> {
  const t0 = performance.now();
  await fn();
  return Math.round(performance.now() - t0);
}

export async function runProbes(client: SupabaseClient): Promise<ProbeResult[]> {
  const results: ProbeResult[] = [];

  // Database
  try {
    const ms = await time(async () => {
      const { error } = await client.from('profiles').select('id', { count: 'exact', head: true });
      if (error) throw new Error(error.message);
    });
    results.push({ name: 'Database', status: ms < 800 ? 'healthy' : 'degraded', latencyMs: ms, detail: 'Postgres via Supabase' });
  } catch (e: any) {
    results.push({ name: 'Database', status: 'down', latencyMs: 0, detail: e?.message || 'query failed' });
  }

  // Authentication
  try {
    const ms = await time(async () => { await client.auth.getSession(); });
    results.push({ name: 'Authentication', status: ms < 800 ? 'healthy' : 'degraded', latencyMs: ms, detail: 'GoTrue sessions' });
  } catch (e: any) {
    results.push({ name: 'Authentication', status: 'down', latencyMs: 0, detail: e?.message || 'auth failed' });
  }

  // Storage
  try {
    const ms = await time(async () => {
      const { error } = await client.storage.listBuckets();
      if (error) throw new Error(error.message);
    });
    results.push({ name: 'Storage', status: ms < 800 ? 'healthy' : 'degraded', latencyMs: ms, detail: 'object buckets' });
  } catch (e: any) {
    results.push({ name: 'Storage', status: 'down', latencyMs: 0, detail: e?.message || 'storage failed' });
  }

  // API (own edge)
  try {
    const ms = await time(async () => {
      const res = await fetch('/api/admin/finance/unmatched', { cache: 'no-store' });
      if (!res.ok && res.status !== 401 && res.status !== 403) throw new Error(`HTTP ${res.status}`);
    });
    results.push({ name: 'API', status: ms < 1200 ? 'healthy' : 'degraded', latencyMs: ms, detail: 'edge routes' });
  } catch (e: any) {
    results.push({ name: 'API', status: 'down', latencyMs: 0, detail: e?.message || 'edge unreachable' });
  }

  // RPC layer (first production RPCs live here)
  try {
    const ms = await time(async () => {
      const { error } = await client.rpc('rpc_health');
      if (error) throw new Error(error.message);
    });
    results.push({ name: 'RPC', status: ms < 800 ? 'healthy' : 'degraded', latencyMs: ms, detail: 'activation + health RPCs live' });
  } catch (e: any) {
    results.push({ name: 'RPC', status: 'down', latencyMs: 0, detail: e?.message || 'rpc failed' });
  }

  // Mapbox
  const mbToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
  if (!mbToken) {
    results.push({ name: 'Mapbox', status: 'unconfigured', latencyMs: 0, detail: 'no token in env' });
  } else {
    try {
      const ms = await time(async () => {
        const res = await fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/probe.json?access_token=${mbToken}&limit=1`);
        if (res.status === 401) throw new Error('token rejected');
        if (res.status >= 500) throw new Error(`HTTP ${res.status}`);
      });
      results.push({ name: 'Mapbox', status: ms < 1200 ? 'healthy' : 'degraded', latencyMs: ms, detail: 'maps + geocoding' });
    } catch (e: any) {
      results.push({ name: 'Mapbox', status: 'down', latencyMs: 0, detail: e?.message || 'unreachable' });
    }
  }

  // Paystack (licensed processor rails)
  try {
    const ms = await time(async () => {
      const res = await fetch('https://api.paystack.co', { cache: 'no-store' });
      if (res.status >= 500) throw new Error(`HTTP ${res.status}`);
    });
    results.push({ name: 'Paystack', status: ms < 1500 ? 'healthy' : 'degraded', latencyMs: ms, detail: 'processor rails' });
  } catch (e: any) {
    results.push({ name: 'Paystack', status: 'down', latencyMs: 0, detail: e?.message || 'unreachable' });
  }

  // Email provider reachability
  try {
    const ms = await time(async () => {
      const res = await fetch('https://api.resend.com', { cache: 'no-store' });
      if (res.status >= 500) throw new Error(`HTTP ${res.status}`);
    });
    results.push({ name: 'Email', status: ms < 1500 ? 'healthy' : 'degraded', latencyMs: ms, detail: 'provider reachability' });
  } catch (e: any) {
    results.push({ name: 'Email', status: 'down', latencyMs: 0, detail: e?.message || 'unreachable' });
  }

  return results;
}
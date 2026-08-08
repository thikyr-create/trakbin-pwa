// lib/core/maps/providers/mapbox/client.ts
const BASE = 'https://api.mapbox.com';

export function mapboxToken(): string {
  const t = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || process.env.MAPBOX_TOKEN;
  if (!t) throw new Error('MAPBOX_TOKEN not configured');
  return t;
}

export async function mapboxFetch(path: string, params: Record<string, string> = {}): Promise<any> {
  const qs = new URLSearchParams({ access_token: mapboxToken(), ...params });
  const url = `${BASE}${path}?${qs.toString()}`;
  const res = await fetch(url);
  const json = await res.json();
  if (!res.ok) throw new Error(`mapbox: ${json.message ?? res.status}`);
  return json;
}
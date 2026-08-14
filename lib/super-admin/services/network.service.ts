// lib/super-admin/services/network.service.ts
import { adminSupabase as supabase } from '../supabase/client';

export interface NetworkPoint {
  id: string;
  lat: number;
  lng: number;
  operatorId: number | null;
  operator: string;
  status: string;
  paid: boolean;
}

export interface EstateStat {
  name: string;
  properties: number;
  mapped: number;
  operators: string[];
  unassigned: number;
}

export interface NetworkOverview {
  properties: number;
  mapped: number;
  active: number;
  paid: number;
  unassigned: number;
  zones: number;
  operators: number;
  estates: EstateStat[];
  points: NetworkPoint[];
  zonesRaw: any[];
}

export async function getNetworkOverview(): Promise<NetworkOverview> {
  const [b, h, z] = await Promise.all([
    supabase.from('Buildings').select('custom_id, estate, latitude, longitude, status, payment_status, company_id'),
    supabase.from('haulers').select('id, business_name'),
    supabase.from('company_zones').select('*'),
  ]);

  const names = new Map((h.data || []).map((x: any) => [Number(x.id), x.business_name]));
  const rows = b.data || [];

  const points: NetworkPoint[] = rows
    .filter((r: any) => r.latitude != null && r.longitude != null && !isNaN(Number(r.latitude)) && !isNaN(Number(r.longitude)))
    .map((r: any) => ({
      id: r.custom_id,
      lat: Number(r.latitude),
      lng: Number(r.longitude),
      operatorId: r.company_id != null ? Number(r.company_id) : null,
      operator: r.company_id != null ? (names.get(Number(r.company_id)) || `#${r.company_id}`) : 'Unassigned',
      status: r.status,
      paid: r.payment_status === 'paid',
    }));

  const estateMap = new Map<string, EstateStat>();
  rows.forEach((r: any) => {
    const key = r.estate || 'Unestated';
    const cur = estateMap.get(key) || { name: key, properties: 0, mapped: 0, operators: [] as string[], unassigned: 0 };
    cur.properties += 1;
    if (r.latitude != null && r.longitude != null) cur.mapped += 1;
    if (r.company_id == null) cur.unassigned += 1;
    const op = r.company_id != null ? (names.get(Number(r.company_id)) || `#${r.company_id}`) : 'Unassigned';
    if (!cur.operators.includes(op)) cur.operators.push(op);
    estateMap.set(key, cur);
  });

  return {
    properties: rows.length,
    mapped: points.length,
    active: rows.filter((r: any) => r.status === 'active').length,
    paid: rows.filter((r: any) => r.payment_status === 'paid').length,
    unassigned: rows.filter((r: any) => r.company_id == null).length,
    zones: (z.data || []).length,
    operators: (h.data || []).length,
    estates: [...estateMap.values()].sort((a, b) => b.properties - a.properties),
    points,
    zonesRaw: z.data || [],
  };
}
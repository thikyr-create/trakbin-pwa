// lib/core/field-intelligence/storage/breadcrumbRepository.ts
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

function admin(): SupabaseClient {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

export interface Breadcrumb {
  id: number;
  driver_id: string;
  company_id: number;
  route_id: string | null;
  lat: number;
  lng: number;
  accuracy_m: number | null;
  speed_mps: number | null;
  heading: number | null;
  recorded_at: string;
}

export const breadcrumbRepository = {
  async listByCompany(
    companyId: number,
    sinceIso: string,
    untilIso: string,
    limit = 50000
  ): Promise<Breadcrumb[]> {
    const c = admin();
    const { data, error } = await c.from('driver_breadcrumbs')
      .select('*')
      .eq('company_id', companyId)
      .gte('recorded_at', sinceIso)
      .lte('recorded_at', untilIso)
      .order('recorded_at', { ascending: true })
      .limit(limit);
    if (error) {
      console.warn('[breadcrumbRepo] listByCompany failed:', error.message);
      return [];
    }
    return (data || []) as Breadcrumb[];
  },

  async listByRoute(
    companyId: number,
    routeId: string,
    sinceIso: string,
    untilIso: string
  ): Promise<Breadcrumb[]> {
    const c = admin();
    const { data, error } = await c.from('driver_breadcrumbs')
      .select('*')
      .eq('company_id', companyId)
      .eq('route_id', routeId)
      .gte('recorded_at', sinceIso)
      .lte('recorded_at', untilIso)
      .order('recorded_at', { ascending: true });
    if (error) {
      console.warn('[breadcrumbRepo] listByRoute failed:', error.message);
      return [];
    }
    return (data || []) as Breadcrumb[];
  },

  async listByDriver(
    companyId: number,
    driverId: string,
    sinceIso: string,
    untilIso: string
  ): Promise<Breadcrumb[]> {
    const c = admin();
    const { data, error } = await c.from('driver_breadcrumbs')
      .select('*')
      .eq('company_id', companyId)
      .eq('driver_id', driverId)
      .gte('recorded_at', sinceIso)
      .lte('recorded_at', untilIso)
      .order('recorded_at', { ascending: true });
    if (error) {
      console.warn('[breadcrumbRepo] listByDriver failed:', error.message);
      return [];
    }
    return (data || []) as Breadcrumb[];
  },
};
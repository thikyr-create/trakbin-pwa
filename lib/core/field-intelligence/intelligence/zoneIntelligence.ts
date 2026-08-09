// lib/core/field-intelligence/intelligence/zoneIntelligence.ts
import { createClient } from '@supabase/supabase-js';
import { observationRepository } from '../storage/observationRepository';
import { intelligenceRepository } from '../storage/intelligenceRepository';
import { clamp01 } from '../models/ConfidenceScore';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

/** Learned zone-level patterns: stop duration, density, difficulty. */
export const zoneIntelligence = {
  async learn(companyId: number, sinceIso: string): Promise<number> {
    const [obs, buildingsRes] = await Promise.all([
      observationRepository.listByCompany(companyId, sinceIso),
      supabase.from('buildings').select('building_id, zone_id, zone_name').eq('company_id', companyId),
    ]);
    const buildings = buildingsRes.data || [];

    const zoneOf = new Map<string, string>();
    for (const b of buildings) {
      zoneOf.set(b.building_id, String(b.zone_id ?? b.zone_name ?? 'unzoned'));
    }

    const dwells = obs.filter((o: any) => o.kind === 'pickup' && o.payload?.dwellMs != null && o.building_id);
    const byZone = new Map<string, number[]>();
    for (const d of dwells) {
      const z = zoneOf.get(d.building_id) ?? 'unzoned';
      if (!byZone.has(z)) byZone.set(z, []);
      byZone.get(z)!.push(Number(d.payload.dwellMs));
    }

    let n = 0;
    for (const [zoneId, list] of byZone) {
      const avgStopMin = Math.round((list.reduce((s, x) => s + x, 0) / list.length) / 60000);
      await intelligenceRepository.upsert(
        companyId, 'zone', zoneId, 'collection_pattern',
        {
          avgStopMin,
          samples: list.length,
          buildings: new Set(dwells.filter((d: any) => zoneOf.get(d.building_id) === zoneId).map((d: any) => d.building_id)).size,
        },
        clamp01(list.length / 30),
        list.length,
        undefined,
        list.length >= 10 ? 'active' : 'candidate'
      );
      n++;
    }
    return n;
  },
};
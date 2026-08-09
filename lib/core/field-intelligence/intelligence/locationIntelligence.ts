// lib/core/field-intelligence/intelligence/locationIntelligence.ts
import { createClient } from '@supabase/supabase-js';
import { signalRepository } from '../storage/signalRepository';
import { intelligenceRepository } from '../storage/intelligenceRepository';
import { confidenceAggregator } from '../confidence/confidenceAggregator';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

/** Learned building locations — the spatial knowledge the VRP will trust. */
export const locationIntelligence = {
  async learn(companyId: number, sinceIso: string): Promise<number> {
    const sigs = await signalRepository.listByCompany(companyId, sinceIso, 'location_accuracy');
    const byBuilding = new Map<string, any[]>();
    for (const s of sigs) {
      if (!byBuilding.has(s.entity_id)) byBuilding.set(s.entity_id, []);
      byBuilding.get(s.entity_id)!.push(s);
    }

    let n = 0;
    for (const [buildingId, list] of byBuilding) {
      const samples = list.reduce((s: number, x: any) => s + Number(x.metadata?.samples ?? 1), 0);
      const confidence = Math.max(...list.map((x: any) => Number(x.confidence)));
      const status = confidenceAggregator.statusFor(confidence, samples);

      // Best-known proposed coordinates come from the latest correction
      const { data: cor } = await supabase.from('field_corrections')
        .select('proposed_value').eq('company_id', companyId)
        .eq('entity_id', buildingId).eq('field', 'location')
        .order('updated_at', { ascending: false }).limit(1).maybeSingle();

      const meanOffset = Math.round(list.reduce((s: number, x: any) => s + Number(x.value), 0) / list.length);

      await intelligenceRepository.upsert(companyId, 'building', buildingId, 'location', {
        proposed: cor?.proposed_value ?? null,
        meanOffsetM: meanOffset,
      }, confidence, samples, undefined, status === 'verified' ? 'active' : 'candidate');
      n++;
    }
    return n;
  },
};
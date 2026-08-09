// lib/core/field-intelligence/correctors/routeCorrector.ts
import { createClient } from '@supabase/supabase-js';
import { feedbackRepository } from '../storage/feedbackRepository';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

/**
 * Repeated deviations on the same route = the map is wrong, not the drivers.
 * Emits VRP feedback (pending — dispatch reviews; never auto-applied).
 */
export const routeCorrector = {
  async evaluate(companyId: number, sinceIso: string, untilIso: string): Promise<number> {
    const { data: signals } = await supabase.from('field_signals')
      .select('*').eq('company_id', companyId).eq('kind', 'road_behavior')
      .gte('created_at', sinceIso).lte('created_at', untilIso);

    let emitted = 0;
    for (const sig of signals || []) {
      if (Number(sig.value) < 2) continue; // pattern needs repetition

      const { data: existing } = await supabase.from('field_feedback')
        .select('id').eq('company_id', companyId).eq('entity_id', sig.entity_id)
        .eq('target', 'vrp').eq('status', 'pending').maybeSingle();
      if (existing) continue;

      await feedbackRepository.insert({
        companyId,
        target: 'vrp',
        entityType: 'route',
        entityId: sig.entity_id,
        suggestion: {
          recurringDeviation: true,
          episodes: Number(sig.value),
          avgMaxDistanceM: sig.metadata?.avgMaxDistanceM ?? null,
        },
        confidence: sig.confidence,
        reason: `${sig.value} repeated deviations — road network likely differs from map`,
      });
      emitted++;
    }
    return emitted;
  },
};
// lib/core/field-intelligence/feedback/routingFeedbackService.ts
import { createClient } from '@supabase/supabase-js';
import { intelligenceRepository } from '../storage/intelligenceRepository';
import { feedbackRepository } from '../storage/feedbackRepository';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

/** Generates VRP routing instructions from learned route/zone intelligence. */
export const routingFeedbackService = {
  async generate(companyId: number): Promise<number> {
    const intel = await intelligenceRepository.listByCompany(companyId);
    let emitted = 0;

    for (const rec of intel) {
      if (rec.status !== 'active') continue;

      // Route travel time overrides
      if (rec.entity_type === 'route' && rec.kind === 'travel_time' && rec.confidence >= 0.8) {
        const { data: exists } = await supabase.from('field_feedback')
          .select('id').eq('company_id', companyId).eq('entity_id', rec.entity_id)
          .eq('target', 'vrp').eq('status', 'pending').maybeSingle();
        if (exists) continue;

        await feedbackRepository.insert({
          companyId,
          target: 'vrp',
          entityType: 'route',
          entityId: rec.entity_id,
          suggestion: rec.value,
          confidence: rec.confidence,
          reason: `Learned route duration: ${rec.value.avgDurationMin}min (confidence ${Math.round(rec.confidence * 100)}%)`,
        });
        emitted++;
      }
    }
    return emitted;
  },
};
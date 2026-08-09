// lib/core/field-intelligence/feedback/locationFeedbackService.ts
import { createClient } from '@supabase/supabase-js';
import { intelligenceRepository } from '../storage/intelligenceRepository';
import { feedbackRepository } from '../storage/feedbackRepository';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

/** Generates location update feedback for the spatial database / map layers. */
export const locationFeedbackService = {
  async generate(companyId: number): Promise<number> {
    const intel = await intelligenceRepository.listByCompany(companyId);
    let emitted = 0;

    for (const rec of intel) {
      if (rec.status !== 'active' || rec.entity_type !== 'building' || rec.kind !== 'location') continue;
      if (!rec.value.proposed) continue;

      const { data: exists } = await supabase.from('field_feedback')
        .select('id').eq('company_id', companyId).eq('entity_id', rec.entity_id)
        .eq('target', 'location').eq('status', 'pending').maybeSingle();
      if (exists) continue;

      await feedbackRepository.insert({
        companyId,
        target: 'location',
        entityType: 'building',
        entityId: rec.entity_id,
        suggestion: rec.value,
        confidence: rec.confidence,
        reason: `Learned building location offset: ${rec.value.meanOffsetM}m`,
      });
      emitted++;
    }
    return emitted;
  },
};
// lib/core/field-intelligence/feedback/driverFeedbackService.ts
import { createClient } from '@supabase/supabase-js';
import { intelligenceRepository } from '../storage/intelligenceRepository';
import { feedbackRepository } from '../storage/feedbackRepository';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

/** Generates dispatch feedback based on driver observation reliability. */
export const driverFeedbackService = {
  async generate(companyId: number): Promise<number> {
    const intel = await intelligenceRepository.listByCompany(companyId);
    let emitted = 0;

    for (const rec of intel) {
      if (rec.status !== 'active' || rec.entity_type !== 'driver') continue;
      
      // Only emit if reliability is very high (trusted) or very low (needs monitoring)
      const reliability = rec.confidence;
      if (reliability < 0.4 || reliability > 0.85) {
        const { data: exists } = await supabase.from('field_feedback')
          .select('id').eq('company_id', companyId).eq('entity_id', rec.entity_id)
          .eq('target', 'dispatch').eq('status', 'pending').maybeSingle();
        if (exists) continue;

        await feedbackRepository.insert({
          companyId,
          target: 'dispatch',
          entityType: 'driver',
          entityId: rec.entity_id,
          suggestion: rec.value,
          confidence: rec.confidence,
          reason: reliability > 0.85 ? 'Highly reliable field observations' : 'Low observation reliability — verify manually',
        });
        emitted++;
      }
    }
    return emitted;
  },
};
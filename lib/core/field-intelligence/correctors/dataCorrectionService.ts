// lib/core/field-intelligence/correctors/dataCorrectionService.ts
import { createClient } from '@supabase/supabase-js';
import { listCompanyBuildingPoints } from '../analyzers/locationAnalyzer';
import { locationCorrector } from './locationCorrector';
import { stopCorrector } from './stopCorrector';
import { routeCorrector } from './routeCorrector';
import { correctionRepository } from '../storage/correctionRepository';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

/** C4 orchestrator: runs every corrector + executes admin-verified corrections. */
export const dataCorrectionService = {
  async run(companyId: number, sinceIso: string, untilIso: string) {
    const points = await listCompanyBuildingPoints(companyId);

    let proposed = 0;
    let applied = 0;
    for (const [buildingId] of points) {
      const r = await locationCorrector.evaluateBuilding(companyId, buildingId, sinceIso);
      if (r.proposed) proposed++;
      if (r.applied) applied++;
    }

    const stopsEvaluated = await stopCorrector.evaluate(companyId, sinceIso, untilIso);
    const routeFeedback = await routeCorrector.evaluate(companyId, sinceIso, untilIso);
    const appliedVerified = await this.applyVerified(companyId);

    return { proposed, applied, stopsEvaluated, routeFeedback, appliedVerified };
  },

  /** Executes corrections an admin (or auto-promotion) has verified. */
  async applyVerified(companyId: number): Promise<number> {
    const { data } = await supabase.from('field_corrections')
      .select('*').eq('company_id', companyId).eq('status', 'verified');

    let n = 0;
    for (const cor of data || []) {
      if (cor.entity_type === 'building' && cor.field === 'location') {
        await locationCorrector.apply(companyId, cor.id, cor.proposed_value, cor.entity_id);
        n++;
      }
    }
    return n;
  },
};
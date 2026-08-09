// lib/core/field-intelligence/correctors/locationCorrector.ts
import { createClient } from '@supabase/supabase-js';
import { observationRepository } from '../storage/observationRepository';
import { correctionRepository } from '../storage/correctionRepository';
import { listCompanyBuildingPoints } from '../analyzers/locationAnalyzer';
import { locationConfidenceEngine } from '../confidence/locationConfidenceEngine';
import { locationUpdatePolicy } from '../policies/locationUpdatePolicy';
import { correctionPolicy } from '../policies/correctionPolicy';
import { fieldEventPublisher } from '../events/fieldEventPublisher';
import { FIELD_INTERNAL_EVENTS } from '../events/fieldEventTypes';
import { haversineKm } from '@/lib/core/route-optimization/routing/routeMatrix';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

/**
 * Proposes building-location corrections from repeated field evidence.
 * NEVER overwrites directly unless policy says verified + auto-apply.
 */
export const locationCorrector = {
  async evaluateBuilding(companyId: number, buildingId: string, sinceIso: string): Promise<{ proposed: boolean; applied: boolean }> {
    const points = await listCompanyBuildingPoints(companyId);
    const stored = points.get(buildingId);
    if (!stored) return { proposed: false, applied: false };

    const obs = await observationRepository.listByBuilding(companyId, buildingId, undefined, 500);
    const usable = obs.filter((o: any) =>
      o.occurred_at >= sinceIso && o.latitude != null &&
      (o.payload?.correction === true || o.kind === 'arrival' || (o.kind === 'pickup' && o.payload?.outcome === 'confirmed'))
    );
    if (usable.length === 0) return { proposed: false, applied: false };

    const offsets = usable.map((o: any) =>
      haversineKm({ latitude: stored.lat, longitude: stored.lng }, { latitude: Number(o.latitude), longitude: Number(o.longitude) }) * 1000
    );
    const corrections = usable.filter((o: any) => o.payload?.correction === true).length;
    const mean = offsets.reduce((s, x) => s + x, 0) / offsets.length;
    const cs = locationConfidenceEngine.score(offsets, corrections);

    if (mean < locationUpdatePolicy.minMeaningfulOffsetM) return { proposed: false, applied: false };
    if (!locationUpdatePolicy.canPropose(cs.score, offsets.length)) return { proposed: false, applied: false };

    // Weighted centroid: driver corrections weigh 3x raw GPS
    let wSum = 0, latSum = 0, lngSum = 0;
    for (const o of usable) {
      const w = o.payload?.correction === true ? 3 : 1;
      wSum += w;
      latSum += w * Number(o.latitude);
      lngSum += w * Number(o.longitude);
    }
    const proposedValue = { latitude: latSum / wSum, longitude: lngSum / wSum };

    await correctionRepository.propose({
      companyId,
      entityType: 'building',
      entityId: buildingId,
      field: 'location',
      currentValue: { latitude: stored.lat, longitude: stored.lng },
      proposedValue,
      confidence: cs.score,
      evidenceCount: 0,
      status: 'candidate',
    });
    await fieldEventPublisher.emit(FIELD_INTERNAL_EVENTS.CORRECTION_PROPOSED, { companyId, entityId: buildingId });

    // Promotion + optional auto-apply
    const pending = await correctionRepository.listPending(companyId);
    const cor = pending.find((c: any) => c.entity_id === buildingId && c.field === 'location');
    let applied = false;
    if (cor) {
      const next = correctionPolicy.nextStatus(cor as any);
      if (next !== cor.status) await correctionRepository.setStatus(cor.id, next);
      const promoted = { ...cor, status: next } as any;
      if (correctionPolicy.canApply(promoted) && locationUpdatePolicy.canAutoApply(cs.score, offsets.length)) {
        await this.apply(companyId, cor.id, proposedValue, buildingId);
        applied = true;
      }
    }
    return { proposed: true, applied };
  },

  async apply(companyId: number, correctionId: number, proposedValue: { latitude: number; longitude: number }, buildingId: string): Promise<void> {
    await supabase.from('buildings')
      .update({ latitude: proposedValue.latitude, longitude: proposedValue.longitude })
      .eq('building_id', buildingId).eq('company_id', companyId);
    await correctionRepository.setStatus(correctionId, 'applied');
    await fieldEventPublisher.emit(FIELD_INTERNAL_EVENTS.CORRECTION_APPLIED, { companyId, entityId: buildingId });
  },
};
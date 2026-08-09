// lib/core/field-intelligence/intelligence/pickupIntelligence.ts
import { signalRepository } from '../storage/signalRepository';
import { observationRepository } from '../storage/observationRepository';
import { intelligenceRepository } from '../storage/intelligenceRepository';
import { confidenceAggregator } from '../confidence/confidenceAggregator';
import { clamp01 } from '../models/ConfidenceScore';

/** Learned collection behavior per building: confidence, volume, skip rate. */
export const pickupIntelligence = {
  async learn(companyId: number, sinceIso: string): Promise<number> {
    const [sigs, obs] = await Promise.all([
      signalRepository.listByCompany(companyId, sinceIso, 'pickup_confidence'),
      observationRepository.listByCompany(companyId, sinceIso),
    ]);

    const pickups = obs.filter((o: any) => o.kind === 'pickup');
    const byBuilding = new Map<string, { confs: number[]; confirmed: number; skipped: number }>();
    for (const s of sigs) {
      if (!byBuilding.has(s.entity_id)) byBuilding.set(s.entity_id, { confs: [], confirmed: 0, skipped: 0 });
      byBuilding.get(s.entity_id)!.confs.push(Number(s.value));
    }
    for (const p of pickups) {
      const key = p.building_id || 'unknown';
      if (!byBuilding.has(key)) byBuilding.set(key, { confs: [], confirmed: 0, skipped: 0 });
      const agg = byBuilding.get(key)!;
      if (p.payload?.outcome === 'confirmed') agg.confirmed++;
      else agg.skipped++;
    }

    let n = 0;
    for (const [buildingId, agg] of byBuilding) {
      if (agg.confs.length === 0) continue;
      const avg = agg.confs.reduce((s, x) => s + x, 0) / agg.confs.length;
      const total = agg.confirmed + agg.skipped;
      const status = confidenceAggregator.statusFor(avg, agg.confs.length);
      await intelligenceRepository.upsert(companyId, 'building', buildingId, 'collection_pattern', {
        avgPickupConfidence: Math.round(avg * 100) / 100,
        confirmed: agg.confirmed,
        skipped: agg.skipped,
        skipRate: total > 0 ? Math.round((agg.skipped / total) * 100) / 100 : 0,
      }, clamp01(avg), agg.confs.length, undefined, status === 'verified' ? 'active' : 'candidate');
      n++;
    }
    return n;
  },
};
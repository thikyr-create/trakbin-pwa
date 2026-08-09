// lib/core/field-intelligence/analyzers/pickupAnalyzer.ts
import { observationRepository } from '../storage/observationRepository';
import { signalRepository } from '../storage/signalRepository';
import { listCompanyBuildingPoints } from './locationAnalyzer';
import { buildSignal } from '../models/FieldSignal';
import { weightedScore, clamp01 } from '../models/ConfidenceScore';
import { confidenceConfig } from '../config/confidenceConfig';
import { gpsConfig } from '../config/gpsConfig';
import { haversineKm } from '@/lib/core/route-optimization/routing/routeMatrix';
import type { FieldSignal } from '../models/FieldSignal';

/**
 * Answers: does the field evidence support that this pickup happened?
 * Fuses GPS proximity + dwell + timing + evidence + history into one confidence.
 */
export const pickupAnalyzer = {
  async analyze(companyId: number, sinceIso: string, untilIso: string): Promise<FieldSignal[]> {
    const [obs, points] = await Promise.all([
      observationRepository.listByCompany(companyId, sinceIso),
      listCompanyBuildingPoints(companyId),
    ]);

    const pickups = obs.filter((o: any) => o.occurred_at <= untilIso && o.kind === 'pickup' && o.payload?.outcome === 'confirmed');
    const signals: FieldSignal[] = [];

    for (const p of pickups) {
      const stored = p.building_id ? points.get(p.building_id) : null;

      // GPS proximity: prefer arrival distance recorded at geofence, else compute vs stored pin
      let distanceM: number | null = p.payload?.arrivalDistanceM ?? null;
      if (distanceM == null && stored && p.latitude != null && p.longitude != null) {
        distanceM = haversineKm({ latitude: stored.lat, longitude: stored.lng }, { latitude: Number(p.latitude), longitude: Number(p.longitude) }) * 1000;
      }
      const gpsScore = distanceM == null ? 0.6 : clamp01(1 - Math.min(distanceM, 200) / 200);

      // Dwell: 1–30 min is believable presence
      const dwellMs: number | null = p.payload?.dwellMs ?? null;
      const dwellScore = dwellMs == null ? 0.5 : dwellMs < 60_000 ? clamp01(dwellMs / 60_000) * 0.6 : dwellMs <= 30 * 60000 ? 1 : 0.7;

      // Timing: neutral unless schedule metadata exists
      const timingScore = 0.7;

      // Evidence: photos/videos attached
      const evidenceScore = (p.payload?.evidenceUrls?.length ?? 0) > 0 ? 1 : 0.3;

      // History: prior pickup_confidence at this building
      const prior = p.building_id ? await signalRepository.latestFor(companyId, 'building', p.building_id, 'pickup_confidence') : null;
      const historyScore = prior ? Number(prior.value) : 0.7;

      const w = confidenceConfig.pickupWeights;
      const score = weightedScore([
        { name: 'gpsProximity', weight: w.gpsProximity, score: gpsScore },
        { name: 'dwell', weight: w.dwell, score: dwellScore },
        { name: 'timing', weight: w.timing, score: timingScore },
        { name: 'evidence', weight: w.evidence, score: evidenceScore },
        { name: 'history', weight: w.history, score: historyScore },
      ]);

      const sig = buildSignal(companyId, 'building', p.building_id || 'unknown', 'pickup_confidence', Math.round(score * 100) / 100, clamp01(score), p.occurred_at, p.occurred_at, [p.id], { distanceM: distanceM != null ? Math.round(distanceM) : null, dwellMs, driverId: p.driver_id });
      await signalRepository.insert(sig);
      signals.push(sig);
    }
    return signals;
  },
};
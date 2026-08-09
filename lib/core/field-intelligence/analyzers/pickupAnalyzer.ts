// lib/core/field-intelligence/analyzers/pickupAnalyzer.ts
import { observationRepository } from '../storage/observationRepository';
import { signalRepository } from '../storage/signalRepository';
import { listCompanyBuildingPoints } from './locationAnalyzer';
import { buildSignal } from '../models/FieldSignal';
import { clamp01 } from '../models/ConfidenceScore';
import { pickupConfidenceEngine } from '../confidence/pickupConfidenceEngine';
import { haversineKm } from '@/lib/core/route-optimization/routing/routeMatrix';
import type { FieldSignal } from '../models/FieldSignal';

/**
 * Answers: does the field evidence support that this pickup happened?
 * Scoring is delegated to pickupConfidenceEngine (single authority).
 */
export const pickupAnalyzer = {
  async analyze(companyId: number, sinceIso: string, untilIso: string): Promise<FieldSignal[]> {
    const [obs, points] = await Promise.all([
      observationRepository.listByCompany(companyId, sinceIso),
      listCompanyBuildingPoints(companyId),
    ]);

    const pickups = obs.filter((o: any) =>
      o.occurred_at <= untilIso && o.kind === 'pickup' && o.payload?.outcome === 'confirmed');

    const signals: FieldSignal[] = [];

    for (const p of pickups) {
      const stored = p.building_id ? points.get(p.building_id) : null;

      // GPS proximity: prefer geofence-recorded arrival distance, else compute vs stored pin
      let distanceM: number | null = p.payload?.arrivalDistanceM ?? null;
      if (distanceM == null && stored && p.latitude != null && p.longitude != null) {
        distanceM = haversineKm(
          { latitude: stored.lat, longitude: stored.lng },
          { latitude: Number(p.latitude), longitude: Number(p.longitude) }
        ) * 1000;
      }
      const dwellMs: number | null = p.payload?.dwellMs ?? null;

      // History: prior pickup_confidence at this building
      const prior = p.building_id
        ? await signalRepository.latestFor(companyId, 'building', p.building_id, 'pickup_confidence')
        : null;

      const cs = pickupConfidenceEngine.score({
        distanceM,
        dwellMs,
        hasSchedule: false,
        onSchedule: false,
        evidenceUrls: p.payload?.evidenceUrls ?? [],
        historyScore: prior ? Number(prior.value) : null,
      });
      const score = cs.score;

      const sig = buildSignal(
        companyId, 'building', p.building_id || 'unknown', 'pickup_confidence',
        Math.round(score * 100) / 100, clamp01(score),
        p.occurred_at, p.occurred_at, [p.id],
        {
          distanceM: distanceM != null ? Math.round(distanceM) : null,
          dwellMs,
          driverId: p.driver_id,
          factors: cs.factors,
        }
      );
      await signalRepository.insert(sig);
      signals.push(sig);
    }
    return signals;
  },
};
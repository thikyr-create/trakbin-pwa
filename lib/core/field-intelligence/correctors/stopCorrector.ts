// lib/core/field-intelligence/correctors/stopCorrector.ts
import { observationRepository } from '../storage/observationRepository';
import { listCompanyBuildingPoints } from '../analyzers/locationAnalyzer';
import { locationCorrector } from './locationCorrector';
import { gpsConfig } from '../config/gpsConfig';
import { confidenceConfig } from '../config/confidenceConfig';
import { haversineKm } from '@/lib/core/route-optimization/routing/routeMatrix';

/**
 * Drivers consistently stopping away from a pin (without explicit corrections)
 * is also evidence. Delegates to locationCorrector for the actual proposal.
 */
export const stopCorrector = {
  async evaluate(companyId: number, sinceIso: string, untilIso: string): Promise<number> {
    const [obs, points] = await Promise.all([
      observationRepository.listByCompany(companyId, sinceIso),
      listCompanyBuildingPoints(companyId),
    ]);

    const stops = obs.filter((o: any) => o.occurred_at <= untilIso && o.kind === 'stop' && o.latitude != null);
    const byBuilding = new Map<string, number>();
    for (const s of stops) {
      let bestId: string | null = null;
      let bestDist = Infinity;
      for (const [id, pt] of points) {
        const d = haversineKm({ latitude: pt.lat, longitude: pt.lng }, { latitude: Number(s.latitude), longitude: Number(s.longitude) }) * 1000;
        if (d < bestDist) { bestDist = d; bestId = id; }
      }
      if (bestId && bestDist > 30 && bestDist <= gpsConfig.approachRadiusM) {
        byBuilding.set(bestId, (byBuilding.get(bestId) ?? 0) + 1);
      }
    }

    let evaluated = 0;
    for (const [buildingId, count] of byBuilding) {
      if (count >= confidenceConfig.minSamples.candidate) {
        await locationCorrector.evaluateBuilding(companyId, buildingId, sinceIso);
        evaluated++;
      }
    }
    return evaluated;
  },
};
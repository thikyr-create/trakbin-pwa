// lib/core/field-intelligence/analyzers/stopAnalyzer.ts
import { observationRepository } from '../storage/observationRepository';
import { signalRepository } from '../storage/signalRepository';
import { listCompanyBuildingPoints } from './locationAnalyzer';
import { buildSignal } from '../models/FieldSignal';
import { clamp01 } from '../models/ConfidenceScore';
import { gpsConfig } from '../config/gpsConfig';
import { haversineKm } from '@/lib/core/route-optimization/routing/routeMatrix';
import type { FieldSignal } from '../models/FieldSignal';

/** Answers: where do drivers actually stop, and do those stops match scheduled buildings? */
export const stopAnalyzer = {
  async analyze(companyId: number, sinceIso: string, untilIso: string): Promise<FieldSignal[]> {
    const [obs, points] = await Promise.all([
      observationRepository.listByCompany(companyId, sinceIso),
      listCompanyBuildingPoints(companyId),
    ]);

    const stops = obs.filter((o: any) => o.occurred_at <= untilIso && o.kind === 'stop' && o.latitude != null);
    const signals: FieldSignal[] = [];
    let matched = 0;

    for (const s of stops) {
      let bestId: string | null = null;
      let bestDist = Infinity;
      for (const [id, pt] of points) {
        const d = haversineKm({ latitude: pt.lat, longitude: pt.lng }, { latitude: Number(s.latitude), longitude: Number(s.longitude) }) * 1000;
        if (d < bestDist) { bestDist = d; bestId = id; }
      }
      if (bestId && bestDist <= gpsConfig.approachRadiusM) {
        matched++;
        const sig = buildSignal(companyId, 'building', bestId, 'stop_duration', Number(s.payload?.dwellMs ?? 0), clamp01(1 - bestDist / gpsConfig.approachRadiusM), s.occurred_at, s.occurred_at, [s.id], { offsetM: Math.round(bestDist), driverId: s.driver_id });
        await signalRepository.insert(sig);
        signals.push(sig);
      }
    }

    if (stops.length > 0) {
      const sig = buildSignal(companyId, 'zone', String(companyId), 'arrival_accuracy', matched / stops.length, clamp01(stops.length / 20), sinceIso, untilIso, [], { stops: stops.length, matched });
      await signalRepository.insert(sig);
      signals.push(sig);
    }
    return signals;
  },
};
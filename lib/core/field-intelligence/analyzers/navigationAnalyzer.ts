// lib/core/field-intelligence/analyzers/navigationAnalyzer.ts
import { observationRepository } from '../storage/observationRepository';
import { signalRepository } from '../storage/signalRepository';
import { routeProcessor } from '../processors/routeProcessor';
import { buildSignal } from '../models/FieldSignal';
import { clamp01 } from '../models/ConfidenceScore';
import type { FieldSignal } from '../models/FieldSignal';

/**
 * Answers: where does planned navigation differ from what drivers actually do?
 * Repeated deviations on the same route = road-network truth the map doesn't know.
 */
export const navigationAnalyzer = {
  async analyze(companyId: number, sinceIso: string, untilIso: string): Promise<FieldSignal[]> {
    const obs = (await observationRepository.listByCompany(companyId, sinceIso))
      .filter((o: any) => o.occurred_at <= untilIso && o.kind === 'route');

    const episodes = routeProcessor.deviationEpisodes(obs);
    const byRoute = new Map<string, typeof episodes>();
    for (const e of episodes) {
      const key = e.routeId || 'unknown';
      if (!byRoute.has(key)) byRoute.set(key, []);
      byRoute.get(key)!.push(e);
    }

    const signals: FieldSignal[] = [];
    for (const [routeId, eps] of byRoute) {
      if (eps.length < 2) continue; // pattern needs repetition
      const avgMax = eps.reduce((s, e) => s + e.maxDistanceM, 0) / eps.length;
      const sig = buildSignal(companyId, 'route', routeId, 'road_behavior', eps.length, clamp01(eps.length / 5), sinceIso, untilIso, [], { avgMaxDistanceM: Math.round(avgMax), drivers: [...new Set(eps.map(e => e.driverId))] });
      await signalRepository.insert(sig);
      signals.push(sig);
    }
    return signals;
  },
};
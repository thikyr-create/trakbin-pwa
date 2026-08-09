// lib/core/field-intelligence/analyzers/deviationAnalyzer.ts
import { observationRepository } from '../storage/observationRepository';
import { signalRepository } from '../storage/signalRepository';
import { routeProcessor } from '../processors/routeProcessor';
import { buildSignal } from '../models/FieldSignal';
import { clamp01 } from '../models/ConfidenceScore';
import type { FieldSignal } from '../models/FieldSignal';

/** Answers: did drivers depart significantly from planned routes, and by how much? */
export const deviationAnalyzer = {
  async analyze(companyId: number, sinceIso: string, untilIso: string): Promise<FieldSignal[]> {
    const obs = (await observationRepository.listByCompany(companyId, sinceIso))
      .filter((o: any) => o.occurred_at <= untilIso && o.kind === 'route');

    const episodes = routeProcessor.deviationEpisodes(obs);
    const signals: FieldSignal[] = [];
    for (const e of episodes) {
      const conf = clamp01((e.durationMs ?? 5 * 60000) / (10 * 60000));
      const sig = buildSignal(
        companyId, 'route', e.routeId || 'unknown', 'route_deviation',
        Math.round(e.maxDistanceM), conf, e.startedAt, e.endedAt ?? untilIso, [],
        { durationMs: e.durationMs, driverId: e.driverId }
      );
      await signalRepository.insert(sig);
      signals.push(sig);
    }
    return signals;
  },
};
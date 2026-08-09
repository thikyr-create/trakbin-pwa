// lib/core/field-intelligence/analyzers/routeAnalyzer.ts
import { observationRepository } from '../storage/observationRepository';
import { signalRepository } from '../storage/signalRepository';
import { routeProcessor } from '../processors/routeProcessor';
import { buildSignal } from '../models/FieldSignal';
import { routeConfidenceEngine } from '../confidence/routeConfidenceEngine';
import type { FieldSignal } from '../models/FieldSignal';

/** Answers: how long do routes actually take, and how much time is lost to deviation? */
export const routeAnalyzer = {
  async analyze(companyId: number, sinceIso: string, untilIso: string): Promise<FieldSignal[]> {
    const obs = (await observationRepository.listByCompany(companyId, sinceIso))
      .filter((o: any) => o.occurred_at <= untilIso && o.kind === 'route');

    const byRoute = new Map<string, any[]>();
    for (const o of obs) {
      const key = o.route_id || 'unknown';
      if (!byRoute.has(key)) byRoute.set(key, []);
      byRoute.get(key)!.push(o);
    }

    const signals: FieldSignal[] = [];
    for (const [routeId, routeObs] of byRoute) {
      const sorted = routeObs.sort((a: any, b: any) => a.occurred_at.localeCompare(b.occurred_at));
      const start = sorted.find((o: any) => o.payload?.phase === 'started');
      const end = sorted.find((o: any) => o.payload?.phase === 'completed');
      const episodes = routeProcessor.deviationEpisodes(routeObs);
      const deviatedMs = episodes.reduce((s, e) => s + (e.durationMs ?? 0), 0);

      if (start && end) {
        const durationMs = new Date(end.occurred_at).getTime() - new Date(start.occurred_at).getTime();
        if (durationMs > 0) {
          const adherence = Math.max(0, 1 - deviatedMs / durationMs);
          const conf = routeConfidenceEngine.score({
            samples: sorted.length,
            adherence,
          }).score;

          const out: FieldSignal[] = [
            buildSignal(companyId, 'route', routeId, 'travel_time', Math.round(durationMs / 60000), conf, sinceIso, untilIso, [], { deviatedMs }),
            buildSignal(companyId, 'route', routeId, 'route_efficiency', adherence, conf, sinceIso, untilIso),
          ];
          for (const s of out) await signalRepository.insert(s);
          signals.push(...out);
        }
      }
    }
    return signals;
  },
};
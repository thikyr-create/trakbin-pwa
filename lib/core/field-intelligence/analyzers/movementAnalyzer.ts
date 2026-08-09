// lib/core/field-intelligence/analyzers/movementAnalyzer.ts
import { observationRepository } from '../storage/observationRepository';
import { signalRepository } from '../storage/signalRepository';
import { movementProcessor } from '../processors/movementProcessor';
import { buildSignal } from '../models/FieldSignal';
import { clamp01 } from '../models/ConfidenceScore';
import type { FieldSignal } from '../models/FieldSignal';

/** Answers: what did drivers actually do? Distance, speed, idle time. */
export const movementAnalyzer = {
  async analyze(companyId: number, sinceIso: string, untilIso: string): Promise<FieldSignal[]> {
    const obs = (await observationRepository.listByCompany(companyId, sinceIso))
      .filter((o: any) => o.occurred_at <= untilIso);

    const byDriver = new Map<string, any[]>();
    for (const o of obs) {
      if (!byDriver.has(o.driver_id)) byDriver.set(o.driver_id, []);
      byDriver.get(o.driver_id)!.push(o);
    }

    const signals: FieldSignal[] = [];
    for (const [driverId, driverObs] of byDriver) {
      const movementObs = driverObs.filter((o: any) => o.kind === 'movement');
      if (movementObs.length < 2) continue;
      const { segments } = movementProcessor.segmentize(movementObs);

      const points = segments.reduce((s, x) => s + x.points, 0);
      const movingMs = segments.reduce((s, x) => s + x.durationMs - x.stoppedMs, 0);
      const stoppedMs = segments.reduce((s, x) => s + x.stoppedMs, 0);
      const distanceM = segments.reduce((s, x) => s + x.distanceM, 0);
      const conf = clamp01(points / 50);

      const out: FieldSignal[] = [
        buildSignal(companyId, 'driver', driverId, 'travel_time', Math.round(movingMs / 60000), conf, sinceIso, untilIso, [], { distanceM: Math.round(distanceM) }),
        buildSignal(companyId, 'driver', driverId, 'stop_duration', Math.round(stoppedMs / 60000), conf, sinceIso, untilIso),
        buildSignal(companyId, 'driver', driverId, 'route_efficiency', movingMs + stoppedMs > 0 ? movingMs / (movingMs + stoppedMs) : 1, conf, sinceIso, untilIso),
      ];
      for (const s of out) await signalRepository.insert(s);
      signals.push(...out);
    }
    return signals;
  },
};
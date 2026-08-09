// lib/core/field-intelligence/analyzers/driverBehaviorAnalyzer.ts
import { observationRepository } from '../storage/observationRepository';
import { signalRepository } from '../storage/signalRepository';
import { driverConfidenceEngine } from '../confidence/driverConfidenceEngine';
import { buildSignal } from '../models/FieldSignal';
import { clamp01 } from '../models/ConfidenceScore';
import { gpsConfig } from '../config/gpsConfig';
import type { FieldSignal } from '../models/FieldSignal';

/**
 * NOT employee scoring. Measures the RELIABILITY of a driver's field
 * observations: GPS quality, arrival honesty, route adherence.
 */
export const driverBehaviorAnalyzer = {
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
      // GPS quality: mean accuracy of movement samples
      const gps = driverObs.filter((o: any) => o.kind === 'movement' && o.gps_accuracy != null);
      const meanAcc = gps.length
        ? gps.reduce((s: number, o: any) => s + Number(o.gps_accuracy), 0) / gps.length
        : null;

      // Arrival honesty: pickups where recorded arrival distance was within tolerance
      const pickups = driverObs.filter((o: any) => o.kind === 'pickup' && o.payload?.outcome === 'confirmed');
      const honest = pickups.filter((o: any) => {
        const d = o.payload?.arrivalDistanceM;
        return d != null && d <= gpsConfig.arrivalRadiusM * 2;
      });

      const reliability = driverConfidenceEngine.score({
        samples: driverObs.length,
        meanAccuracyM: meanAcc,
        arrivalHonesty: pickups.length > 0 ? honest.length / pickups.length : null,
      });

      if (pickups.length > 0) {
        const sig = buildSignal(
          companyId, 'driver', driverId, 'arrival_accuracy',
          honest.length / pickups.length, reliability.score, sinceIso, untilIso, [],
          { pickups: pickups.length, factors: reliability.factors }
        );
        await signalRepository.insert(sig);
        signals.push(sig);
      }

      if (meanAcc != null) {
        const sig = buildSignal(
          companyId, 'driver', driverId, 'route_efficiency',
          clamp01(1 - meanAcc / gpsConfig.accuracyCeilingM), reliability.score, sinceIso, untilIso, [],
          { meanAccuracyM: Math.round(meanAcc), factors: reliability.factors }
        );
        await signalRepository.insert(sig);
        signals.push(sig);
      }
    }
    return signals;
  },
};
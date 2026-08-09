// lib/core/field-intelligence/confidence/driverConfidenceEngine.ts
import type { ConfidenceScore } from '../models/ConfidenceScore';
import { weightedScore, clamp01 } from '../models/ConfidenceScore';
import { gpsConfig } from '../config/gpsConfig';

export interface DriverEvidenceInput {
  samples: number;
  meanAccuracyM?: number | null;
  arrivalHonesty?: number | null;   // fraction of pickups with truthful arrival distance
  adherence?: number | null;
  evidenceRate?: number | null;     // fraction of pickups with evidence
}

/**
 * Confidence in the RELIABILITY of a driver's observations —
 * explicitly NOT an employee performance score.
 */
export const driverConfidenceEngine = {
  score(input: DriverEvidenceInput): ConfidenceScore {
    const factors = [
      { name: 'samples', weight: 0.2, score: clamp01(input.samples / 50) },
    ];
    if (input.meanAccuracyM != null) factors.push({ name: 'gpsQuality', weight: 0.3, score: clamp01(1 - input.meanAccuracyM / gpsConfig.accuracyCeilingM) });
    if (input.arrivalHonesty != null) factors.push({ name: 'arrivalHonesty', weight: 0.3, score: clamp01(input.arrivalHonesty) });
    if (input.adherence != null) factors.push({ name: 'routeAdherence', weight: 0.2, score: clamp01(input.adherence) });

    return { score: weightedScore(factors), factors, sampleCount: input.samples, computedAt: new Date().toISOString() };
  },
};
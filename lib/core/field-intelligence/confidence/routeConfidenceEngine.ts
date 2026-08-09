// lib/core/field-intelligence/confidence/routeConfidenceEngine.ts
import type { ConfidenceScore } from '../models/ConfidenceScore';
import { weightedScore, clamp01 } from '../models/ConfidenceScore';

export interface RouteEvidenceInput {
  samples: number;
  adherence?: number | null;        // 0..1 (1 - deviated/total)
  meanAccuracyM?: number | null;
  episodeDurationMs?: number | null;
}

/** Trust in route-level measurements (duration, efficiency, deviation episodes). */
export const routeConfidenceEngine = {
  score(input: RouteEvidenceInput): ConfidenceScore {
    const factors = [
      { name: 'samples', weight: 0.5, score: clamp01(input.samples / 20) },
    ];
    if (input.adherence != null) factors.push({ name: 'adherence', weight: 0.3, score: clamp01(input.adherence) });
    if (input.meanAccuracyM != null) factors.push({ name: 'gpsQuality', weight: 0.2, score: clamp01(1 - input.meanAccuracyM / 50) });
    if (input.episodeDurationMs != null) factors.push({ name: 'episodeDuration', weight: 0.3, score: clamp01(input.episodeDurationMs / (10 * 60000)) });

    return { score: weightedScore(factors), factors, sampleCount: input.samples, computedAt: new Date().toISOString() };
  },
};
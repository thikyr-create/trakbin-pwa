// lib/core/field-intelligence/confidence/locationConfidenceEngine.ts
import type { ConfidenceScore } from '../models/ConfidenceScore';
import { weightedScore, clamp01 } from '../models/ConfidenceScore';
import { confidenceConfig } from '../config/confidenceConfig';

/** How much do we trust that a building's stored location is wrong / a candidate is right? */
export const locationConfidenceEngine = {
  score(offsetsM: number[], corrections: number): ConfidenceScore {
    const n = offsetsM.length;
    if (n === 0) return { score: 0, factors: [], sampleCount: 0, computedAt: new Date().toISOString() };

    const mean = offsetsM.reduce((s, x) => s + x, 0) / n;
    const std = Math.sqrt(offsetsM.reduce((s, x) => s + (x - mean) ** 2, 0) / n);

    const factors = [
      { name: 'samples', weight: 0.4, score: clamp01(n / confidenceConfig.minSamples.promote) },
      { name: 'consistency', weight: 0.4, score: clamp01(1 - Math.min(std, 200) / 200) },
      { name: 'driverCorrections', weight: 0.2, score: clamp01(corrections / 3) },
    ];

    return { score: weightedScore(factors), factors, sampleCount: n, computedAt: new Date().toISOString() };
  },
};
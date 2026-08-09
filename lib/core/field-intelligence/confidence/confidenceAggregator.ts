// lib/core/field-intelligence/confidence/confidenceAggregator.ts
import type { ConfidenceScore } from '../models/ConfidenceScore';
import { clamp01 } from '../models/ConfidenceScore';
import { confidenceConfig } from '../config/confidenceConfig';

export type PromotionStatus = 'none' | 'candidate' | 'strong_candidate' | 'verified';

/** Combines scores and maps (score, samples) → promotion status. */
export const confidenceAggregator = {
  combine(entries: { score: ConfidenceScore; weight: number }[]): ConfidenceScore {
    const totalW = entries.reduce((s, e) => s + e.weight, 0);
    if (totalW <= 0) return { score: 0, factors: [], sampleCount: 0, computedAt: new Date().toISOString() };
    const score = clamp01(entries.reduce((s, e) => s + e.weight * e.score.score, 0) / totalW);
    return {
      score,
      factors: entries.flatMap((e) => e.score.factors),
      sampleCount: entries.reduce((s, e) => s + e.score.sampleCount, 0),
      computedAt: new Date().toISOString(),
    };
  },

  /**
   * 1 observation → candidate only.
   * Consistent observations → strong_candidate.
   * High confidence + min samples (or admin approval later) → verified.
   */
  statusFor(score: number, sampleCount: number): PromotionStatus {
    const t = confidenceConfig.thresholds;
    const m = confidenceConfig.minSamples;
    if (score >= t.autoApply && sampleCount >= m.promote) return 'verified';
    if (score >= t.strongCandidate && sampleCount >= m.strong) return 'strong_candidate';
    if (score >= t.proposeCorrection && sampleCount >= m.candidate) return 'candidate';
    return 'none';
  },
};
// lib/core/field-intelligence/confidence/pickupConfidenceEngine.ts
import type { ConfidenceScore } from '../models/ConfidenceScore';
import { weightedScore, clamp01 } from '../models/ConfidenceScore';
import { confidenceConfig } from '../config/confidenceConfig';
import { evidenceConfidenceEngine } from './evidenceConfidenceEngine';

export interface PickupEvidenceInput {
  distanceM: number | null;      // arrival distance vs stored pin
  dwellMs: number | null;
  hasSchedule: boolean;
  onSchedule: boolean;
  evidenceUrls: string[];
  evidenceKinds?: string[];
  historyScore: number | null;   // prior pickup_confidence at this building
}

/**
 * "Driver clicked pickup" vs "GPS + dwell + timing + evidence all agree".
 * This engine is the ONLY place pickup confidence is computed.
 */
export const pickupConfidenceEngine = {
  score(input: PickupEvidenceInput): ConfidenceScore {
    const w = confidenceConfig.pickupWeights;

    const gpsScore = input.distanceM == null ? 0.6 : clamp01(1 - Math.min(input.distanceM, 200) / 200);

    const dwellScore =
      input.dwellMs == null ? 0.5 :
      input.dwellMs < 60_000 ? clamp01(input.dwellMs / 60_000) * 0.6 :
      input.dwellMs <= 30 * 60_000 ? 1 : 0.7;

    const timingScore = !input.hasSchedule ? 0.7 : input.onSchedule ? 1 : 0.3;

    const ev = evidenceConfidenceEngine.score(input.evidenceUrls, input.evidenceKinds);

    const factors = [
      { name: 'gpsProximity', weight: w.gpsProximity, score: gpsScore },
      { name: 'dwell', weight: w.dwell, score: dwellScore },
      { name: 'timing', weight: w.timing, score: timingScore },
      { name: 'evidence', weight: w.evidence, score: ev.score },
      { name: 'history', weight: w.history, score: input.historyScore ?? 0.7 },
    ];

    return { score: weightedScore(factors), factors, sampleCount: 1, computedAt: new Date().toISOString() };
  },
};
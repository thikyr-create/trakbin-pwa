// lib/core/field-intelligence/policies/locationUpdatePolicy.ts
import { confidenceConfig } from '../config/confidenceConfig';

/** The guard between "interesting signal" and "touch the spatial database". */
export const locationUpdatePolicy = {
  /** Offsets below this are noise — never "correct" a 5m difference */
  minMeaningfulOffsetM: 30,

  canPropose(confidence: number, samples: number): boolean {
    return confidence >= confidenceConfig.thresholds.proposeCorrection &&
           samples >= confidenceConfig.minSamples.candidate;
  },

  canAutoApply(confidence: number, samples: number): boolean {
    return confidence >= confidenceConfig.thresholds.autoApply &&
           samples >= confidenceConfig.minSamples.promote;
  },
};
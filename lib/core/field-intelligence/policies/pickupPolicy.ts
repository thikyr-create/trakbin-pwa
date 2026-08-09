// lib/core/field-intelligence/policies/pickupPolicy.ts
import { confidenceConfig } from '../config/confidenceConfig';

/** What happens to a pickup claim at each confidence band. */
export const pickupPolicy = {
  /** Below this: flagged for company review, never silently accepted */
  requiresReview(score: number): boolean {
    return score < confidenceConfig.thresholds.proposeCorrection;
  },
  /** Above this: accepted without review */
  autoAccept(score: number): boolean {
    return score >= confidenceConfig.thresholds.strongCandidate;
  },
};
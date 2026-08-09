// lib/core/field-intelligence/config/confidenceConfig.ts
export const confidenceConfig = {
  thresholds: {
    /** Below this: observation only, no correction */
    proposeCorrection: 0.6,
    /** candidate → strong_candidate */
    strongCandidate: 0.75,
    /** Above this + min samples: auto-apply (still logged) */
    autoApply: 0.9,
  },
  minSamples: {
    candidate: 3,
    strong: 5,
    promote: 10,
  },
  /** Pickup-confidence factor weights (sum = 1) */
  pickupWeights: {
    gpsProximity: 0.35,
    dwell: 0.25,
    timing: 0.15,
    evidence: 0.15,
    history: 0.10,
  },
} as const;
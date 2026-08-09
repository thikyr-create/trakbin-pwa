// lib/core/field-intelligence/config/processingConfig.ts
export const processingConfig = {
  /** Minimum stopped time to count as dwell */
  minDwellMs: 60_000,
  /** Gaps beyond this split movement segments */
  maxPingGapMs: 30_000,
  replayBatchSize: 500,
  /** Fallbacks when no learned value is confident enough */
  serviceTimeDefaultMin: 10,
  travelSpeedDefaultKmh: 25,
} as const;
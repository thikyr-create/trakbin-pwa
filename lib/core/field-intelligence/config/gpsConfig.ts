// lib/core/field-intelligence/config/gpsConfig.ts
export const gpsConfig = {
  /** Reject samples with horizontal accuracy worse than this */
  accuracyCeilingM: 50,
  /** Physically impossible speed between pings → outlier */
  impossibleSpeedKmh: 130,
  /** Inside this = arrived */
  arrivalRadiusM: 25,
  /** Inside this = approaching */
  approachRadiusM: 120,
  /** Single ping jump beyond this (short dt) → GPS glitch */
  pingJumpOutlierM: 300,
  /** Below this speed = stopped (dwell detection) */
  stopSpeedKmh: 5,
} as const;
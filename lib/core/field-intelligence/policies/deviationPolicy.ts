// lib/core/field-intelligence/policies/deviationPolicy.ts
/** When does a deviation matter enough to learn from? */
export const deviationPolicy = {
  minDistanceM: 150,
  minDurationMs: 2 * 60_000,

  countsAsEpisode(distanceM: number, durationMs: number | null): boolean {
    if (distanceM < this.minDistanceM) return false;
    return durationMs == null || durationMs >= this.minDurationMs;
  },
};
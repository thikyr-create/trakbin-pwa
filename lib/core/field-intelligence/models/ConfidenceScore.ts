// lib/core/field-intelligence/models/ConfidenceScore.ts
export interface ConfidenceFactor {
  name: string;
  weight: number;                   // weights should sum to 1
  score: number;                    // 0..1
}

export interface ConfidenceScore {
  score: number;                    // 0..1
  factors: ConfidenceFactor[];
  sampleCount: number;
  computedAt: string;
}

export function clamp01(x: number): number {
  return Math.min(1, Math.max(0, x));
}

export function weightedScore(factors: ConfidenceFactor[]): number {
  const totalWeight = factors.reduce((s, f) => s + f.weight, 0);
  if (totalWeight <= 0) return 0;
  const raw = factors.reduce((s, f) => s + f.weight * clamp01(f.score), 0);
  return clamp01(raw / totalWeight);
}
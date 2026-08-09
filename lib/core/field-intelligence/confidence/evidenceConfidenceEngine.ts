// lib/core/field-intelligence/confidence/evidenceConfidenceEngine.ts
import type { ConfidenceScore } from '../models/ConfidenceScore';
import { weightedScore, clamp01 } from '../models/ConfidenceScore';

/** How much does attached evidence strengthen a field claim? */
export const evidenceConfidenceEngine = {
  score(urls: string[], kinds?: string[]): ConfidenceScore {
    const n = urls?.length ?? 0;
    const countScore = clamp01(n / 3);
    let varietyScore = 0;
    if (n > 0) {
      const hasPhoto = !kinds || kinds.some((k) => k.startsWith('image'));
      const hasVideo = kinds?.some((k) => k.startsWith('video'));
      varietyScore = hasPhoto && hasVideo ? 1 : 0.6;
    }
    const factors = [
      { name: 'evidenceCount', weight: 0.6, score: countScore },
      { name: 'evidenceVariety', weight: 0.4, score: varietyScore },
    ];
    return { score: weightedScore(factors), factors, sampleCount: n, computedAt: new Date().toISOString() };
  },
};
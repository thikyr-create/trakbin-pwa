// lib/core/field-intelligence/policies/correctionPolicy.ts
import { confidenceConfig } from '../config/confidenceConfig';
import type { FieldCorrection } from '../models/FieldCorrection';

/** Lifecycle: candidate → strong_candidate → verified → applied (or rejected). */
export const correctionPolicy = {
  nextStatus(cor: FieldCorrection): FieldCorrection['status'] {
    if (cor.status === 'rejected' || cor.status === 'applied' || cor.status === 'verified') return cor.status;
    const t = confidenceConfig.thresholds;
    const m = confidenceConfig.minSamples;
    if (cor.confidence >= t.autoApply && cor.evidenceCount >= m.promote) return 'verified';
    if (cor.confidence >= t.strongCandidate && cor.evidenceCount >= m.strong) return 'strong_candidate';
    return 'candidate';
  },

  /** Only verified corrections may be executed. Admin approval (C7) or auto-promotion sets verified. */
  canApply(cor: FieldCorrection): boolean {
    return cor.status === 'verified';
  },
};
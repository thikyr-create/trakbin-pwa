// lib/core/field-intelligence/models/FieldCorrection.ts
export type CorrectionStatus = 'candidate' | 'strong_candidate' | 'verified' | 'rejected' | 'applied';

export interface FieldCorrection {
  id?: number;
  companyId: number;
  entityType: 'building' | 'stop' | 'route';
  entityId: string;
  field: string;                    // e.g. 'location'
  currentValue: Record<string, unknown>;
  proposedValue: Record<string, unknown>;
  confidence: number;
  evidenceCount: number;
  status: CorrectionStatus;
  reviewedBy?: string | null;
}
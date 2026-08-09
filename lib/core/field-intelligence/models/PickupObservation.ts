// lib/core/field-intelligence/models/PickupObservation.ts
export type PickupOutcome = 'confirmed' | 'skipped' | 'failed';

export interface PickupObservation {
  buildingId: string;
  outcome: PickupOutcome;
  confirmedAt: string;
  reason?: string | null;
  dwellMs?: number | null;
  evidenceUrls?: string[];
}
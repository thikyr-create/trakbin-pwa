// lib/core/field-intelligence/models/RoutingFeedback.ts
export interface RoutingFeedback {
  id?: number;
  companyId: number;
  target: 'vrp' | 'location' | 'dispatch';
  entityType: string;
  entityId: string;
  suggestion: Record<string, unknown>;
  confidence: number;
  reason: string;
  status?: 'pending' | 'applied' | 'dismissed';
  appliedAt?: string | null;
}
// lib/core/field-intelligence/models/FieldIntelligence.ts
export type IntelligenceEntityType = 'building' | 'zone' | 'route' | 'driver';
export type IntelligenceKind = 'location' | 'service_time' | 'travel_time' | 'deviation_pattern' | 'collection_pattern';
export type IntelligenceStatus = 'candidate' | 'active' | 'stale';

export interface FieldIntelligenceRecord {
  id?: number;
  companyId: number;
  entityType: IntelligenceEntityType;
  entityId: string;
  kind: IntelligenceKind;
  value: Record<string, unknown>;
  confidence: number;
  sampleCount: number;
  variance?: number | null;
  status: IntelligenceStatus;
  updatedAt?: string;
}
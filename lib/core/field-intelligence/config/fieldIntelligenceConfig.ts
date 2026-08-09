// lib/core/field-intelligence/config/fieldIntelligenceConfig.ts
export const fieldIntelligenceConfig = {
  enabled: process.env.FIELD_INTELLIGENCE_ENABLED !== 'false',
  realtimeIngestion: true,
  retentionDays: 365,
  cronBatchSize: 1000,
  emitLearnedEvents: true,
} as const;
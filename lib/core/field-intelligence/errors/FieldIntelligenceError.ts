// lib/core/field-intelligence/errors/FieldIntelligenceError.ts
export class FieldIntelligenceError extends Error {
  constructor(message: string, public code: string, public cause?: unknown) {
    super(message);
    this.name = 'FieldIntelligenceError';
  }
}

export class IngestionError extends FieldIntelligenceError {
  constructor(message: string, cause?: unknown) { super(message, 'FI_INGESTION', cause); this.name = 'IngestionError'; }
}

export class AnalysisError extends FieldIntelligenceError {
  constructor(message: string, cause?: unknown) { super(message, 'FI_ANALYSIS', cause); this.name = 'AnalysisError'; }
}

export class StorageError extends FieldIntelligenceError {
  constructor(message: string, cause?: unknown) { super(message, 'FI_STORAGE', cause); this.name = 'StorageError'; }
}

export class PolicyError extends FieldIntelligenceError {
  constructor(message: string, cause?: unknown) { super(message, 'FI_POLICY', cause); this.name = 'PolicyError'; }
}
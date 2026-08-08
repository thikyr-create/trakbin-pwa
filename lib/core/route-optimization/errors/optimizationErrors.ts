export type OptimizationErrorCode = 'NO_VALID_STOPS' | 'INVALID_INPUT' | 'PROVIDER_FAILED';

export class OptimizationError extends Error {
  constructor(public code: OptimizationErrorCode, message: string) {
    super(message);
    this.name = 'OptimizationError';
  }
}
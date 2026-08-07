export interface RetryPolicy { maxAttempts: number; backoffMs: number; }
export const defaultRetryPolicy: RetryPolicy = { maxAttempts: 3, backoffMs: 250 };

export async function withRetry<T>(fn: () => T | Promise<T>, policy = defaultRetryPolicy): Promise<T> {
  let lastErr: unknown;
  for (let attempt = 1; attempt <= policy.maxAttempts; attempt++) {
    try { return await fn(); }
    catch (e) {
      lastErr = e;
      if (attempt < policy.maxAttempts) await new Promise((r) => setTimeout(r, policy.backoffMs * attempt));
    }
  }
  throw lastErr;
}
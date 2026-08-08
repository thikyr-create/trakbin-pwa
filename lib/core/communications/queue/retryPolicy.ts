// lib/core/communications/queue/retryPolicy.ts
/** Exponential backoff with jitter. Caps at 4 hours. */
export function nextAttemptAt(attempts: number): string {
  const baseMs = Math.min(60_000 * Math.pow(2, attempts - 1), 4 * 60 * 60 * 1000);
  const jitter = Math.floor(Math.random() * baseMs * 0.2);
  return new Date(Date.now() + baseMs + jitter).toISOString();
}

export const DEFAULT_MAX_ATTEMPTS = 5;
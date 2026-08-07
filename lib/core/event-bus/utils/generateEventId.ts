export function generateEventId(): string {
  try { return crypto.randomUUID(); }
  catch { return `evt-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`; }
}
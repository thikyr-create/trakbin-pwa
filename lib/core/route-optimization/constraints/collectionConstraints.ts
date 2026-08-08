/** "08:30" → 510 minutes from midnight */
export function parseTimeToMinutes(t: string): number {
  const m = /^(\d{1,2}):(\d{2})$/.exec(t.trim());
  if (!m) return 0;
  return Number(m[1]) * 60 + Number(m[2]);
}
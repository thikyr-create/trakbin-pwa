/** Formats a stored naira integer as ₦ with thousands separators. */
export function naira(amount?: number | null): string {
  const v = amount ?? 0;
  return `₦${v.toLocaleString('en-NG', { maximumFractionDigits: 0 })}`;
}

/** Compact timestamp: "Aug 26, 3:40 PM". */
export function dateTime(iso?: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

/** Live relative day label: Today / Tomorrow / In X days / concrete date. */
export function dayLabel(iso?: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '—';

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfTarget = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const diffDays = Math.round((startOfTarget.getTime() - startOfToday.getTime()) / 86400000);

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Tomorrow';
  if (diffDays === -1) return 'Yesterday';
  if (diffDays > 1 && diffDays <= 3) return `In ${diffDays} days`;
  return d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
}

const DAY_MAP: Record<string, number> = { sun: 0, mon: 1, tue: 2, wed: 3, thu: 4, fri: 5, sat: 6 };

/** Nearest upcoming pickup date: real scheduled date first, else derived from pickup_days. */
export function nextPickupISO(assignment: any, schedules: any[]): string | null {
  const scheduled = schedules
    .map((s) => s.next_pickup_date)
    .filter(Boolean)
    .sort()[0] ?? null;
  if (scheduled) return scheduled;

  const pd = assignment?.pickup_days;
  const days: string[] = Array.isArray(pd) ? pd : typeof pd === 'string' ? pd.split(',') : [];
  const targets = days
    .map((d) => DAY_MAP[String(d).trim().slice(0, 3).toLowerCase()])
    .filter((n) => n != null);
  if (!targets.length) return null;

  const now = new Date();
  for (let offset = 0; offset < 8; offset++) {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() + offset);
    if (targets.includes(d.getDay())) {
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    }
  }
  return null;
}
// One derivation, used everywhere a "next pickup" appears on screen,
// so the dashboard card, the vitals panel, and the /collection page
// can never disagree. Pure + tested-by-construction; no Supabase here.

const WEEK = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'] as const;
const ABBREV_TO_FULL: Record<string, string> = {
  sun: 'Sunday', mon: 'Monday', tue: 'Tuesday', wed: 'Wednesday',
  thu: 'Thursday', fri: 'Friday', sat: 'Saturday',
};

/** Accept either a TEXT[] (service_assignments.pickup_days) or a comma
 *  string (collection_schedules.pickup_day) and return clean weekday names.
 *  Normalizes abbreviations (Mon → Monday) so every consumer agrees. */
export function parseDays(raw: unknown): string[] {
  if (Array.isArray(raw)) {
    return raw.map((d) => {
      const trimmed = String(d).trim().toLowerCase();
      return ABBREV_TO_FULL[trimmed] || trimmed;
    }).filter(Boolean);
  }
  if (typeof raw === 'string' && raw.trim()) {
    return raw.split(',').map((d) => {
      const trimmed = d.trim().toLowerCase();
      return ABBREV_TO_FULL[trimmed] || trimmed;
    }).filter(Boolean);
  }
  return [];
}

export interface NextPickup {
  label: string;   // "Today" | "Tomorrow" | weekday name
  inDays: number;  // 0 = today
  date: Date;
}

/** Next upcoming pickup day on or after `from`, scanning at most 8 days. */
export function nextPickupFromDays(days: string[], from: Date = new Date()): NextPickup | null {
  const set = new Set(days.map((d) => d.toLowerCase()));
  if (set.size === 0) return null;
  for (let offset = 0; offset < 8; offset++) {
    const d = new Date(from);
    d.setDate(from.getDate() + offset);
    d.setHours(0, 0, 0, 0);
    if (set.has(WEEK[d.getDay()].toLowerCase())) {
      const label = offset === 0 ? 'Today' : offset === 1 ? 'Tomorrow' : WEEK[d.getDay()];
      return { label, inDays: offset, date: d };
    }
  }
  return null;
}

export function formatWindow(w?: string | null): string {
  const s = (w || '').trim();
  return s || '—';
}

/** Stored value may already include the word "Zone"; never double it. */
export function zoneLabel(z?: string | null): string | null {
  if (!z) return null;
  const s = String(z).trim();
  return /^zone\s/i.test(s) ? s : `Zone ${s}`;
}
// lib/core/communications/utils/date.ts
export function isoNow(): string { return new Date().toISOString(); }
export function addMinutes(iso: string, minutes: number): string {
  return new Date(new Date(iso).getTime() + minutes * 60_000).toISOString();
}
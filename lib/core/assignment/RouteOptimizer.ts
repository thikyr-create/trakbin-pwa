export interface Stop { building_id: string; lat: number; lng: number; }
export function haversineKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const R = 6371;
  const dLat = (b.lat - a.lat) * Math.PI / 180;
  const dLng = (b.lng - a.lng) * Math.PI / 180;
  const s = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * Math.PI / 180) * Math.cos(b.lat * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(s), Math.sqrt(1 - s));
}
// nearest-neighbour ordering; swap for Mapbox Optimization API later without touching callers
export function optimizeStops(stops: Stop[]): { ordered: Stop[]; distanceKm: number } {
  if (!stops.length) return { ordered: [], distanceKm: 0 };
  const remaining = [...stops]; const ordered: Stop[] = [remaining.shift() as Stop];
  let distanceKm = 0;
  while (remaining.length) {
    const last = ordered[ordered.length - 1];
    let bi = 0, bd = Infinity;
    remaining.forEach((s, i) => { const d = haversineKm(last, s); if (d < bd) { bd = d; bi = i; } });
    distanceKm += bd; ordered.push(remaining.splice(bi, 1)[0]);
  }
  return { ordered, distanceKm: Math.round(distanceKm * 10) / 10 };
}
export function estimateDurationMin(distanceKm: number, stopCount: number): number {
  const AVG_SPEED_KMH = 25, PER_STOP_MIN = 6;
  return Math.round((distanceKm / AVG_SPEED_KMH) * 60 + stopCount * PER_STOP_MIN);
}
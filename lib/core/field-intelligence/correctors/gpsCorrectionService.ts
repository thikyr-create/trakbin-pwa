// lib/core/field-intelligence/correctors/gpsCorrectionService.ts
export interface GpsPoint { lat: number; lng: number; ts: string; }

/** Pure GPS cleaning utilities — deterministic, no side effects. */
export const gpsCorrectionService = {
  /** Drop single-ping teleport glitches (huge jump in tiny dt). */
  removeJumps(points: GpsPoint[], maxJumpM: number, maxDtMs: number): GpsPoint[] {
    const out: GpsPoint[] = [];
    for (const p of points) {
      const prev = out[out.length - 1];
      if (prev) {
        const dt = new Date(p.ts).getTime() - new Date(prev.ts).getTime();
        const d = haversineM(prev, p);
        if (d > maxJumpM && dt < maxDtMs) continue; // glitch
      }
      out.push(p);
    }
    return out;
  },

  /** Median filter over a sliding window — kills outlier pings. */
  medianSmooth(points: GpsPoint[], window = 3): GpsPoint[] {
    if (points.length < window) return points;
    const out: GpsPoint[] = [];
    const half = Math.floor(window / 2);
    for (let i = 0; i < points.length; i++) {
      const slice = points.slice(Math.max(0, i - half), i + half + 1);
      const lats = slice.map((p) => p.lat).sort((a, b) => a - b);
      const lngs = slice.map((p) => p.lng).sort((a, b) => a - b);
      const mid = Math.floor(slice.length / 2);
      out.push({ ...points[i], lat: lats[mid], lng: lngs[mid] });
    }
    return out;
  },
};

function haversineM(a: GpsPoint, b: GpsPoint): number {
  const R = 6371000;
  const toRad = (x: number) => (x * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const s = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}
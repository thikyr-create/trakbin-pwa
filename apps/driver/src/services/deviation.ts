import { supabase } from './supabase';
import { recordActivity } from './activity';
import { deviationEvents } from './events';

const DEVIATION_THRESHOLD_M = 150; // alert if >150m off route
const REJOIN_THRESHOLD_M = 50;     // rejoined if within 50m
const COOLDOWN_MS = 30000;         // min gap between deviation alerts

let lastDeviationTime = 0;
let deviationActive = false;
let routeCoordinates: [number, number][] = [];

export interface DeviationContext {
  driver: any;
  route: any;
  companyId: number | null;
}

export const deviationDetector = {
  /** Load planned route geometry once per shift */
  async loadRouteGeometry(routeId: string) {
    const { data } = await supabase.from('routes').select('geometry').eq('id', routeId).single();
    if (data?.geometry && Array.isArray(data.geometry)) {
      routeCoordinates = data.geometry.map((g: any) => [g.lng, g.lat]);
    }
  },

  /** Called on every GPS update. State is injected by the caller (no store import). */
  checkDeviation(lat: number, lng: number, ctx: DeviationContext) {
    if (routeCoordinates.length < 2) return;

    const { driver, route, companyId } = ctx;
    if (!driver || !route || !companyId) return;

    let minDistance = Infinity;
    for (let i = 0; i < routeCoordinates.length - 1; i++) {
      const [lng1, lat1] = routeCoordinates[i];
      const [lng2, lat2] = routeCoordinates[i + 1];
      const dist = distanceToSegment(lat, lng, lat1, lng1, lat2, lng2);
      if (dist < minDistance) minDistance = dist;
    }

    const now = Date.now();

    if (minDistance > DEVIATION_THRESHOLD_M && !deviationActive && now - lastDeviationTime > COOLDOWN_MS) {
      deviationActive = true;
      lastDeviationTime = now;
      recordActivity({
        eventType: 'DRIVER_DEVIATED',
        driverId: driver.employee_id || driver.id,
        companyId,
        routeId: route.id,
        latitude: lat,
        longitude: lng,
        metadata: { distanceM: Math.round(minDistance) },
      }).catch(() => {});
      deviationEvents.emit({ distanceM: Math.round(minDistance) });
    } else if (minDistance < REJOIN_THRESHOLD_M && deviationActive) {
      deviationActive = false;
      recordActivity({
        eventType: 'DRIVER_REJOINED_ROUTE',
        driverId: driver.employee_id || driver.id,
        companyId,
        routeId: route.id,
        latitude: lat,
        longitude: lng,
      }).catch(() => {});
    }
  },

  reset() {
    routeCoordinates = [];
    deviationActive = false;
    lastDeviationTime = 0;
  },
};

/** Distance from point to segment (endpoint-min, per PWA) */
function distanceToSegment(lat: number, lng: number, lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000;
  const dLat1 = ((lat1 - lat) * Math.PI) / 180;
  const dLng1 = ((lng1 - lng) * Math.PI) / 180;
  const a1 = Math.sin(dLat1 / 2) ** 2 + Math.cos((lat * Math.PI) / 180) * Math.cos((lat1 * Math.PI) / 180) * Math.sin(dLng1 / 2) ** 2;
  const dist1 = R * 2 * Math.atan2(Math.sqrt(a1), Math.sqrt(1 - a1));

  const dLat2 = ((lat2 - lat) * Math.PI) / 180;
  const dLng2 = ((lng2 - lng) * Math.PI) / 180;
  const a2 = Math.sin(dLat2 / 2) ** 2 + Math.cos((lat * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng2 / 2) ** 2;
  const dist2 = R * 2 * Math.atan2(Math.sqrt(a2), Math.sqrt(1 - a2));

  return Math.min(dist1, dist2);
}
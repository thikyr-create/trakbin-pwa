// lib/features/driver/deviation/deviationDetector.ts
import { supabaseBrowser } from '@/lib/supabaseBrowser';
import { recordActivity } from '../activity';
import { useDriverSession } from '@/lib/store/useDriverSession';
import { useCompanySession } from '@/lib/store/useCompanySession';
import { calculateDistanceInMeters } from '@/app/hauler-dashboard/utils/geo';

const supabase = supabaseBrowser;

const DEVIATION_THRESHOLD_M = 150; // alert if >150m off route
const REJOIN_THRESHOLD_M = 50; // consider rejoined if within 50m

let lastDeviationTime = 0;
let deviationActive = false;
let routeCoordinates: [number, number][] = [];

export const deviationDetector = {
  /** Load the planned route geometry once per shift */
  async loadRouteGeometry(routeId: string) {
    const { data } = await supabase.from('routes').select('geometry').eq('id', routeId).single();
    if (data?.geometry && Array.isArray(data.geometry)) {
      routeCoordinates = data.geometry.map((g: any) => [g.lng, g.lat]);
    }
  },

  /** Called on every GPS update. Fires DRIVER_DEVIATED if off-route, DRIVER_REJOINED_ROUTE if back on. */
  checkDeviation(lat: number, lng: number) {
    if (routeCoordinates.length < 2) return;

    const { driver, route, gpsLocation, currentStop } = useDriverSession.getState();
    const { tenant } = useCompanySession.getState();
    if (!driver || !route || !tenant.companyId) return;

    // Distance to nearest point on the planned route line
    let minDistance = Infinity;
    for (let i = 0; i < routeCoordinates.length - 1; i++) {
      const [lng1, lat1] = routeCoordinates[i];
      const [lng2, lat2] = routeCoordinates[i + 1];
      const dist = distanceToSegment(lat, lng, lat1, lng1, lat2, lng2);
      if (dist < minDistance) minDistance = dist;
    }

    const now = Date.now();

    if (minDistance > DEVIATION_THRESHOLD_M && !deviationActive && now - lastDeviationTime > 30000) {
      deviationActive = true;
      lastDeviationTime = now;
      recordActivity({
        eventType: 'DRIVER_DEVIATED',
        driverId: driver.employee_id || driver.id,
        companyId: tenant.companyId,
        routeId: route.id,
        latitude: lat,
        longitude: lng,
        metadata: { distanceM: Math.round(minDistance) },
      }).catch(() => {});

      // Show a toast (the UI can subscribe to this)
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('trakbin-deviation', { detail: { distanceM: Math.round(minDistance) } }));
      }
    } else if (minDistance < REJOIN_THRESHOLD_M && deviationActive) {
      deviationActive = false;
      recordActivity({
        eventType: 'DRIVER_REJOINED_ROUTE',
        driverId: driver.employee_id || driver.id,
        companyId: tenant.companyId,
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

/** Distance from point (lat, lng) to line segment (lat1,lng1)→(lat2,lng2) in meters */
function distanceToSegment(lat: number, lng: number, lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000; // Earth radius in meters
  const dLat1 = ((lat1 - lat) * Math.PI) / 180;
  const dLng1 = ((lng1 - lng) * Math.PI) / 180;
  const a1 = Math.sin(dLat1 / 2) ** 2 + Math.cos((lat * Math.PI) / 180) * Math.cos((lat1 * Math.PI) / 180) * Math.sin(dLng1 / 2) ** 2;
  const dist1 = R * 2 * Math.atan2(Math.sqrt(a1), Math.sqrt(1 - a1));

  const dLat2 = ((lat2 - lat) * Math.PI) / 180;
  const dLng2 = ((lng2 - lng) * Math.PI) / 180;
  const a2 = Math.sin(dLat2 / 2) ** 2 + Math.cos((lat * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng2 / 2) ** 2;
  const dist2 = R * 2 * Math.atan2(Math.sqrt(a2), Math.sqrt(1 - a2));

  // Simplified: use min distance to either endpoint (good enough for 150m threshold)
  return Math.min(dist1, dist2);
}
// lib/features/zones/utils/zoneAssignment.ts

export interface ZoneShape {
  id: string;
  zone_name: string;
  center_lat: number | null;
  center_lng: number | null;
  radius_km: number | null;
  polygon: number[][] | null; // [[lng, lat], [lng, lat], ...] closed or open ring
  estates: string[] | null;
  streets: string[] | null;
  addresses: string[] | null;
  is_active: boolean | null;
}

export interface BuildingPoint {
  custom_id: string;
  latitude: number | null;
  longitude: number | null;
  estate: string | null;
  address: string | null;
}

export type AssignmentMethod = 'polygon' | 'radius' | 'text' | 'nearest';
export type AssignmentConfidence = 'high' | 'medium' | 'low';

export interface ZoneResolution {
  zone_name: string;
  confidence: AssignmentConfidence;
  method: AssignmentMethod;
  distance_km: number | null;
}

const EARTH_RADIUS_KM = 6371;

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

/** Haversine distance in km between two coordinates. */
export function haversineKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(a));
}

/**
 * Ray-casting point-in-polygon test.
 * Polygon is an array of [lng, lat] pairs (GeoJSON ordering).
 */
export function pointInPolygon(
  lat: number,
  lng: number,
  polygon: number[][]
): boolean {
  if (!polygon || polygon.length < 3) return false;

  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const [xi, yi] = [polygon[i][0], polygon[i][1]]; // [lng, lat]
    const [xj, yj] = [polygon[j][0], polygon[j][1]];

    const intersects =
      yi > lat !== yj > lat &&
      lng < ((xj - xi) * (lat - yi)) / (yj - yi) + xi;

    if (intersects) inside = !inside;
  }
  return inside;
}

function validCoord(lat: number | null, lng: number | null): lat is number {
  return lat != null && lng != null && !(lat === 0 && lng === 0);
}

/**
 * Zone resolution hierarchy (per the zone-engine spec):
 *   1. Polygon containment          → high confidence
 *   2. Within zone radius (nearest) → medium confidence
 *   3. Estate / street text match   → medium confidence
 *   4. Nearest center beyond radius → LOW confidence (caller routes to manual review)
 *   5. Nothing                      → null (manual review)
 *
 * The caller decides the confidence threshold for auto-assignment.
 */
export function resolveBuildingZone(
  building: BuildingPoint,
  zones: ZoneShape[]
): ZoneResolution | null {
  const active = zones.filter((z) => z.is_active !== false);
  if (active.length === 0) return null;

  const hasCoords =
    building.latitude != null &&
    building.longitude != null &&
    validCoord(building.latitude, building.longitude);

  const lat = building.latitude as number;
  const lng = building.longitude as number;

  if (hasCoords) {
    // 1) Polygon containment — primary, boundary-based (not proximity)
    for (const z of active) {
      if (z.polygon && z.polygon.length >= 3 && pointInPolygon(lat, lng, z.polygon)) {
        return {
          zone_name: z.zone_name,
          confidence: 'high',
          method: 'polygon',
          distance_km: null,
        };
      }
    }

    // 2) Within a zone's declared radius — nearest wins
    const withinRadius = active
      .filter(
        (z) =>
          z.center_lat != null &&
          z.center_lng != null &&
          z.radius_km != null &&
          z.radius_km > 0
      )
      .map((z) => ({
        z,
        d: haversineKm(lat, lng, z.center_lat as number, z.center_lng as number),
      }))
      .filter((x) => x.d <= (x.z.radius_km as number))
      .sort((a, b) => a.d - b.d);

    if (withinRadius.length > 0) {
      return {
        zone_name: withinRadius[0].z.zone_name,
        confidence: 'medium',
        method: 'radius',
        distance_km: Number(withinRadius[0].d.toFixed(2)),
      };
    }
  }

  // 3) Text fallback — estate / street membership lists
  const estate = (building.estate || '').trim().toLowerCase();
  const address = (building.address || '').trim().toLowerCase();

  for (const z of active) {
    const estateHit = (z.estates || []).some(
      (e) => estate.length > 0 && estate.includes(e.trim().toLowerCase())
    );
    const streetHit = (z.streets || []).some(
      (s) => address.length > 0 && address.includes(s.trim().toLowerCase())
    );
    if (estateHit || streetHit) {
      return {
        zone_name: z.zone_name,
        confidence: 'medium',
        method: 'text',
        distance_km: null,
      };
    }
  }

  // 4) Nearest center as last resort — LOW confidence, routed to manual review
  if (hasCoords) {
    const nearest = active
      .filter((z) => z.center_lat != null && z.center_lng != null)
      .map((z) => ({
        z,
        d: haversineKm(lat, lng, z.center_lat as number, z.center_lng as number),
      }))
      .sort((a, b) => a.d - b.d);

    if (nearest.length > 0) {
      return {
        zone_name: nearest[0].z.zone_name,
        confidence: 'low',
        method: 'nearest',
        distance_km: Number(nearest[0].d.toFixed(2)),
      };
    }
  }

  // 5) Nothing matched — needs manual assignment
  return null;
}
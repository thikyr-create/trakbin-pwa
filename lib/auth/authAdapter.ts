import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

async function geocodeAddress(address: string): Promise<{ lat: number; lon: number } | null> {
  try {
    const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`);
    const data = await res.json();
    if (data && data.length > 0) return { lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon) };
  } catch (err) { console.error('Geocoding failed', err); }
  return null;
}

async function fetchActiveZones() {
  const { data } = await supabase.from('company_zones').select('*').eq('is_active', true);
  return data || [];
}

export const authAdapter = {
  async queryBuildingByIdPasscode(buildingId: string, passcode: string) {
    const { data, error } = await supabase
      .from('Buildings').select('*')
      .eq('custom_id', buildingId).eq('passcode', passcode)
      .limit(1).maybeSingle();
    if (error) return null;
    return data;
  },

  // mirrors the existing login order: try employee_id first, then email
  async queryUserByCredentials(identifier: string, password: string) {
    const { data: byEmployee } = await supabase
      .from('users').select('*')
      .eq('employee_id', identifier).eq('password', password).limit(1);
    if (byEmployee && byEmployee.length > 0) return { user: byEmployee[0], accountType: 'Driver' as const };

    const { data: byEmail } = await supabase
      .from('users').select('*')
      .eq('email', identifier).eq('password', password).limit(1);
    if (byEmail && byEmail.length > 0) {
      const u = byEmail[0];
      return { user: u, accountType: (u.account_type === 'Driver' ? 'Driver' : 'WasteCompany') as 'Driver' | 'WasteCompany' };
    }
    return null;
  },

  async buildingIdExists(customId: string) {
    const { data } = await supabase.from('Buildings').select('custom_id').eq('custom_id', customId).maybeSingle();
    return !!data;
  },

  async insertBuilding(row: any) { return supabase.from('Buildings').insert([row]); },

  async insertServiceRequest(row: any) { return supabase.from('service_requests').insert([row]); },

  async assignServiceRequest(buildingId: string, companyId: number) {
    return supabase.from('service_requests')
      .update({ company_id: companyId, status: 'auto_assigned' })
      .eq('building_id', buildingId);
  },

  // kept as a data op; the engine no longer calls it (approval flow instead)
  async setBuildingCompany(customId: string, companyId: number) {
    return supabase.from('Buildings').update({ company_id: companyId }).eq('custom_id', customId);
  },

  async emailExists(email: string) {
    const { data } = await supabase.from('users').select('email').eq('email', email).maybeSingle();
    return !!data;
  },

  async insertHauler(row: any) { return supabase.from('haulers').insert([row]).select().single(); },

  async insertUser(row: any) { return supabase.from('users').insert([row]); },
    async queryBuildingByIdAndAddress(buildingId: string, officialAddress: string) {
    const { data } = await supabase.from('Buildings').select('*').eq('custom_id', buildingId).maybeSingle();
    if (!data) return null;
    const a = (data.address || '').toLowerCase().replace(/\s+/g, ' ').trim();
    const b = (officialAddress || '').toLowerCase().replace(/\s+/g, ' ').trim();
    return a === b ? data : null;
  },

  async updateBuildingPasscode(customId: string, passcode: string) {
    return supabase.from('Buildings').update({ passcode }).eq('custom_id', customId);
  },

  // dual-layer (+estate/street/address) matcher
  async matchBuilding(opts: { officialAddress: string; estate?: string; coords: { lat: number; lon: number } }): Promise<number | null> {
    const { officialAddress, estate, coords } = opts;
    const geocoded = await geocodeAddress(officialAddress);
    const zones = await fetchActiveZones();
    if (!zones || zones.length === 0) return null;

    const estateLower = (estate || '').toLowerCase().trim();
    const firstToken = officialAddress.toLowerCase().split(',')[0].trim();

    for (const zone of zones) {
      const addressLower = officialAddress.toLowerCase();
      const zoneNameLower = String(zone.zone_name || '').toLowerCase();
      const zoneEstates: string[] = Array.isArray(zone.estates) ? zone.estates.map((x: any) => String(x).toLowerCase()) : [];
      const zoneStreets: string[] = Array.isArray(zone.streets) ? zone.streets.map((x: any) => String(x).toLowerCase()) : [];
      const zoneAddresses: string[] = Array.isArray(zone.addresses) ? zone.addresses.map((x: any) => String(x).toLowerCase()) : [];

      // Layer 0: estate / street / address membership
      if (
        (estateLower && (zoneEstates.includes(estateLower) || zoneStreets.includes(estateLower))) ||
        (firstToken && (zoneEstates.includes(firstToken) || zoneStreets.includes(firstToken) || zoneAddresses.includes(firstToken)))
      ) {
        return zone.company_id;
      }

      // Layer 1: semantic text match (address + estate vs zone_name)
      const hay = estateLower ? `${addressLower} ${estateLower}` : addressLower;
      if (zoneNameLower && (hay.includes(zoneNameLower) || zoneNameLower.includes(firstToken))) {
        return zone.company_id;
      }

      // Layer 2: geospatial radius match
      const checkLat = geocoded ? geocoded.lat : coords.lat;
      const checkLon = geocoded ? geocoded.lon : coords.lon;
      const R = 6371;
      const dLat = (checkLat - zone.center_lat) * Math.PI / 180;
      const dLon = (checkLon - zone.center_lng) * Math.PI / 180;
      const a = Math.sin(dLat / 2) ** 2 +
        Math.cos(zone.center_lat * Math.PI / 180) * Math.cos(checkLat * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      if (R * c <= zone.radius_km) return zone.company_id;
    }
    return null;
  },
};
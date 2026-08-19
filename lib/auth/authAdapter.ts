import { supabaseBrowser } from '@/lib/supabaseBrowser';
import { resolveBuildingZone } from '@/lib/features/zones/utils/zoneAssignment';

const supabase = supabaseBrowser;

async function geocodeAddress(address: string): Promise<{ lat: number; lon: number } | null> {
  try {
    const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`);
    const data = await res.json();
    if (data && data.length > 0) return { lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon) };
  } catch (err) { console.error('Geocoding failed', err); }
  return null;
}

async function fetchActiveZones() {
  const { data } = await supabase
    .from('company_zones')
    .select('id, company_id, zone_name, center_lat, center_lng, radius_km, polygon, estates, streets, addresses, is_active')
    .neq('is_active', false);
  return data || [];
}

export const authAdapter = {
  async queryBuildingByIdPasscode(buildingId: string, passcode: string) {
    const { data, error } = await supabase.from('Buildings').select('*').eq('custom_id', buildingId).eq('passcode', passcode).limit(1).maybeSingle();
    if (error) return null;
    return data;
  },

  async queryUserByCredentials(identifier: string, password: string) {
    const { data: byEmployee } = await supabase.from('users').select('*').eq('employee_id', identifier).eq('password', password).limit(1);
    if (byEmployee && byEmployee.length > 0) return { user: byEmployee[0], accountType: 'Driver' as const };
    const { data: byEmail } = await supabase.from('users').select('*').eq('email', identifier).eq('password', password).limit(1);
    if (byEmail && byEmail.length > 0) {
      const u = byEmail[0];
      return { user: u, accountType: (u.account_type === 'Driver' ? 'Driver' : 'WasteCompany') as 'Driver' | 'WasteCompany' };
    }
    return null;
  },

  async queryUserByAuthOrEmail(authId: string, email: string) {
    const { data: byAuth } = await supabase.from('users').select('*').eq('auth_id', authId).limit(1);
    if (byAuth && byAuth.length > 0) { const u = byAuth[0]; return { user: u, accountType: (u.account_type === 'Driver' ? 'Driver' : 'WasteCompany') as 'Driver' | 'WasteCompany' }; }
    const { data: byEmail } = await supabase.from('users').select('*').eq('email', email).limit(1);
    if (byEmail && byEmail.length > 0) { const u = byEmail[0]; return { user: u, accountType: (u.account_type === 'Driver' ? 'Driver' : 'WasteCompany') as 'Driver' | 'WasteCompany' }; }
    return null;
  },

  async buildingIdExists(customId: string) {
    const { data } = await supabase.from('Buildings').select('custom_id').eq('custom_id', customId).maybeSingle();
    return !!data;
  },

  async insertBuilding(row: any) { return supabase.from('Buildings').insert([row]); },
  async insertServiceRequest(row: any) { return supabase.from('service_requests').insert([row]); },
  async assignServiceRequest(buildingId: string, companyId: number) {
    return supabase.from('service_requests').update({ company_id: companyId, status: 'auto_assigned' }).eq('building_id', buildingId);
  },
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

  // verification updates
  async markEmailVerified(companyId: number) { return supabase.from('haulers').update({ email_verified: true }).eq('id', companyId); },
  async setDocuments(companyId: number, urls: string[], status: string) {
    return supabase.from('haulers').update({ documents_urls: urls, documents_status: status }).eq('id', companyId);
  },

    async matchBuilding(opts: { officialAddress: string; estate?: string; coords: { lat: number; lon: number } }): Promise<number | null> {
    const { officialAddress, estate, coords } = opts;
    const geocoded = await geocodeAddress(officialAddress);
    const lat = geocoded ? geocoded.lat : coords.lat;
    const lng = geocoded ? geocoded.lon : coords.lon;

    // Fetch ALL active zones (cross-company read is intentional here:
    // registration matching must discover WHICH company covers the address)
    const { data: zones } = await supabase
      .from('company_zones')
      .select('id, company_id, zone_name, center_lat, center_lng, radius_km, polygon, estates, streets, addresses, is_active')
      .neq('is_active', false);

    if (!zones || zones.length === 0) return null;

    // Polygon â†’ radius â†’ text hierarchy (nearest = low confidence, rejected)
    const res = resolveBuildingZone(
      { custom_id: 'registration', latitude: lat, longitude: lng, estate: estate || null, address: officialAddress },
      zones as any
    );

    if (!res || res.confidence === 'low') return null;
    const zone = zones.find((z: any) => z.zone_name === res.zone_name);
    return zone?.company_id ?? null;
  },         
};            
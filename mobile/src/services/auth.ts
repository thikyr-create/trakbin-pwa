// mobile/services/auth.ts
import { supabase, API_BASE } from './supabase';

async function post(path: string, body: any) {
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return res.json();
}

async function adoptSession(json: any): Promise<{ ok: boolean; message?: string }> {
  const sess = json.session ?? json;
  if (!sess?.access_token || !sess?.refresh_token) return { ok: false, message: 'Malformed auth response' };
  const { error } = await supabase.auth.setSession({ access_token: sess.access_token, refresh_token: sess.refresh_token });
  if (error) return { ok: false, message: error.message };
  return { ok: true };
}

export async function driverLogin(driver_id: string, password: string) {
  const json = await post('/api/auth/driver-login', { driver_id, password });
  if (!json.ok) return { ok: false, message: json.message || 'Invalid Driver ID or password' };
  return adoptSession(json);
}

export async function caretakerLogin(building_id: string, passcode: string) {
  const json = await post('/api/auth/caretaker-login', { building_id, passcode });
  if (!json.ok) return { ok: false, message: json.message || 'Invalid Building ID or passcode' };
  return adoptSession(json);
}

/** Role detection mirrors the web identity guards. */
export async function detectRole(): Promise<{ role: 'driver' | 'caretaker' | null; driver?: any; building?: any; unsupported?: string }> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { role: null };

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle();
  if (profile?.role === 'caretaker') {
    const buildingId = user.user_metadata?.building_id || profile?.building_id;
    const { data: building } = await supabase.from('Buildings').select('*').eq('custom_id', buildingId).maybeSingle();
    return { role: 'caretaker', building };
  }

  const { data: driver } = await supabase.from('drivers').select('*').eq('user_id', user.id).maybeSingle();
  if (driver) return { role: 'driver', driver };

  return { role: null, unsupported: profile?.role };
}

export async function signOut() {
  await supabase.auth.signOut();
}

export async function registerCaretaker(input: {
  passcode: string;
  buildingType: string;
  officialAddress: string;
  estate: string | null;
  gpsAddress: string;
  latitude: number;
  longitude: number;
  numberOfFlats: string | null;
  numberOfShops: string | null;
}) {
  return post('/api/auth/register-caretaker', input);
}

export async function resetCaretakerPasscode(buildingId: string, officialAddress: string, newPasscode: string) {
  return post('/api/auth/reset-caretaker-passcode', { buildingId, officialAddress, newPasscode });
}
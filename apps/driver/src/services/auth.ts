import { supabase, API_BASE } from './supabase';

// src/services/auth.ts (replace the post function)
async function post(path: string, body: any, retries = 2): Promise<any> {
  try {
    const res = await fetch(`${API_BASE}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const txt = await res.text();
    try {
      return JSON.parse(txt);
    } catch {
      return { ok: false, message: `Server error (${res.status}). Endpoint may not be deployed yet.` };
    }
  } catch (e: any) {
    if (retries > 0 && e.message?.includes('Failed to fetch')) {
      await new Promise(r => setTimeout(r, 1000));
      return post(path, body, retries - 1);
    }
    return { ok: false, message: 'Network error. Check your internet connection and try again.' };
  }
}

async function adoptSession(json: any): Promise<{ ok: boolean; message?: string }> {
  const sess = json.session ?? json;
  if (!sess?.access_token || !sess?.refresh_token) return { ok: false, message: 'Malformed auth response' };
  const { error } = await supabase.auth.setSession({ access_token: sess.access_token, refresh_token: sess.refresh_token });
  if (error) return { ok: false, message: error.message };
  return { ok: true };
}

export async function driverLogin(employeeId: string, password: string) {
  const json = await post('/api/auth/driver-login', { employeeId, password });
  if (!json.ok) return { ok: false, message: json.message || 'Invalid Driver ID or password', driver: null };
  const adopted = await adoptSession(json);
  if (!adopted.ok) return { ok: false, message: adopted.message, driver: null };
  return { ok: true, message: null, driver: json.driver };
}

export async function detectRole(): Promise<{ role: 'driver' | null; driver?: any }> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { role: null };
  const { data: driver } = await supabase.from('drivers').select('*').eq('user_id', user.id).maybeSingle();
  if (driver) return { role: 'driver', driver };
  return { role: null };
}

export async function signOut() {
  await supabase.auth.signOut();
}
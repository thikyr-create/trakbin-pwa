// lib/auth/authEngine.ts
import { authAdapter } from './authAdapter';
import { supabaseAuth } from './supabaseAuth';
import { useAuthStore } from '@/lib/store/authStore';
import { BuildingPublisher } from '@/lib/core/event-bus';
import type { AuthResult, CaretakerRegisterInput, CompanyRegisterInput, LoginInput, RegisterCaretakerResult, Role } from './types';

const KEYS = { caretaker: 'trakbin_caretaker', company: 'trakbin_company', driver: 'trakbin_driver' } as const;

function generateBuildingId() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let result = 'TRK-';
  for (let i = 0; i < 6; i++) result += chars.charAt(Math.floor(Math.random() * chars.length));
  return result;
}

export const authEngine = {
  async login(input: LoginInput): Promise<AuthResult> {
    // ── CARETAKER: Building ID + passcode → real Supabase session ──
    if (input.accountType === 'Caretaker') {
      const res = await fetch('/api/auth/caretaker-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          buildingId: (input.buildingId || '').trim(),
          passcode: (input.passcode || '').trim(),
        }),
      });

      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.ok) {
        return { ok: false, message: '❌ Invalid Building ID or Passcode' };
      }

      // Mint a REAL Supabase session from the synthetic identity
      const { error } = await supabaseAuth.signInWithPassword(data.email, data.password);
      if (error) {
        return { ok: false, message: '❌ Session error: ' + error.message };
      }

      localStorage.setItem(KEYS.caretaker, JSON.stringify(data.building));
      useAuthStore.getState().setSession('caretaker', data.building);
      return { ok: true, message: '✅ Login successful! Redirecting...', role: 'caretaker' };
    }

    // ── DRIVER: employee ID + password → real session via API ──
    // (Caretaker already returned above, so only company/driver reach here)
    const idOrEmail = (input.email || '').trim();
    if (/^DRV-/i.test(idOrEmail)) {
      const res = await fetch('/api/auth/driver-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ employeeId: idOrEmail, password: (input.password || '').trim() }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.ok) return { ok: false, message: '❌ Invalid Driver ID or password' };

      const { error } = await supabaseAuth.client.auth.setSession({
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
      });
      if (error) return { ok: false, message: '❌ Session error: ' + error.message };

      const row = { ...data.driver, id: data.driver.company_id ?? data.driver.id };
      localStorage.setItem(KEYS.driver, JSON.stringify(row));
      useAuthStore.getState().setSession('driver', row);
      return { ok: true, message: '✅ Login successful! Redirecting...', role: 'driver' };
    }

    // ── COMPANY / DRIVER(by email) / ADMIN: email + password ──
    const email = idOrEmail;
    const password = (input.password || '').trim();

    // 1) Supabase Auth first (hashed password, real session)
    try {
      const { data, error } = await supabaseAuth.signInWithPassword(email, password);
      if (error) {
        if (/confirm/i.test(error.message)) return { ok: false, message: '⚠️ Please confirm your email before signing in — check your inbox.' };
      } else if (data.user) {
        // Verified identity: profiles is the server-side source of truth
        const { data: profile } = await supabaseAuth.client
          .from('profiles')
          .select('company_id, role')
          .eq('id', data.user.id)
          .maybeSingle();

        // ADMIN: platform plane — hard-redirect to the admin console.
        // The returned role is inert: window.location wins the navigation race,
        // and admins never hold a tenant session in authStore.
        if (profile?.role === 'admin') {
          if (typeof window !== 'undefined') window.location.href = '/admin';
          return { ok: true, message: '✅ Admin detected — redirecting...', role: 'driver' };
        }

        const res = await authAdapter.queryUserByAuthOrEmail(data.user.id, email);
        const companyId = res?.user?.company_id ?? profile?.company_id ?? null;
        const accountType = res?.accountType || (profile?.role === 'driver' ? 'Driver' : 'WasteCompany');

        // NORMALIZED row: id = company id (numeric). Never the auth UUID,
        // never the legacy users.id. Every downstream engine reads .id
        const row = { ...(res?.user || { email }), id: companyId, company_id: companyId };

        if (data.user.email_confirmed_at && companyId) {
          await authAdapter.markEmailVerified(companyId).catch(() => {});
        }

        const role: Role = accountType === 'Driver' ? 'driver' : 'company';
        const key = accountType === 'Driver' ? KEYS.driver : KEYS.company;
        localStorage.setItem(key, JSON.stringify(row));
        useAuthStore.getState().setSession(role, row);
        return { ok: true, message: '✅ Login successful! Redirecting...', role };
      }
    } catch { /* fall through to legacy */ }

    // 2) legacy fallback (existing users not yet migrated)
    const res = await authAdapter.queryUserByCredentials(email, password);
    if (!res) return { ok: false, message: '❌ Invalid ID/Email or password' };
    if (res.accountType === 'WasteCompany') {
      const row = { ...res.user, id: res.user.company_id ?? res.user.id };
      localStorage.setItem(KEYS.company, JSON.stringify(row));
      useAuthStore.getState().setSession('company', row);
      return { ok: true, message: '✅ Login successful! Redirecting...', role: 'company' };
    }
    const dRow = { ...res.user, id: res.user.company_id ?? res.user.id };
    localStorage.setItem(KEYS.driver, JSON.stringify(dRow));
    useAuthStore.getState().setSession('driver', dRow);
    return { ok: true, message: '✅ Login successful! Redirecting...', role: 'driver' };
  },

  async registerCaretaker(input: CaretakerRegisterInput): Promise<RegisterCaretakerResult> {
    let generatedId = generateBuildingId();
    let isUnique = false; let attempts = 0;
    while (!isUnique && attempts < 10) {
      const exists = await authAdapter.buildingIdExists(generatedId);
      if (!exists) isUnique = true; else { generatedId = generateBuildingId(); attempts++; }
    }
    if (!isUnique) return { ok: false, message: '❌ Unable to generate unique Building ID. Please try again.' };

    const today = new Date(); const currentDay = today.getDate();
    let nextBillingDate = new Date(today.getFullYear(), today.getMonth() + 1, 1);
    if (currentDay > 25) nextBillingDate = new Date(today.getFullYear(), today.getMonth() + 2, 1);

    let number_of_units = 1; let unit_type = 'unit';
    if (input.buildingType === 'Residential Multi-Unit') { number_of_units = parseInt(input.numberOfFlats || '1'); unit_type = 'flats'; }
    
    else if (input.buildingType === 'Commercial') { number_of_units = parseInt(input.numberOfShops || '1'); unit_type = 'shops'; }
    const buildingRow = {
      custom_id: generatedId, passcode: input.passcode, building_type: input.buildingType,
      address: input.officialAddress, estate: input.estate || null, gps_location_address: input.gpsAddress,
      latitude: input.latitude, longitude: input.longitude, status: 'pending', payment_status: 'unpaid',
      next_billing_date: nextBillingDate.toISOString().split('T')[0], billing_day: 1, company_id: null,
      number_of_units, unit_type,
    };
    const { error: buildingError } = await authAdapter.insertBuilding(buildingRow);
    if (buildingError) return { ok: false, message: 'Error: ' + buildingError.message };

    const requestNumber = `REQ-${Date.now().toString().slice(-6)}`;
    await authAdapter.insertServiceRequest({ request_number: requestNumber, building_id: generatedId, caretaker_name: 'Caretaker', status: 'pending', submitted_at: new Date().toISOString() });

    const matchedCompanyId = await authAdapter.matchBuilding({ officialAddress: input.officialAddress, estate: input.estate, coords: { lat: input.latitude, lon: input.longitude } });
    if (matchedCompanyId) await authAdapter.assignServiceRequest(generatedId, matchedCompanyId);

    // EVENT BUS: notify engines a new building entered the platform
    BuildingPublisher.publish('BUILDING_REGISTERED', { buildingId: generatedId });

    return { ok: true, message: '✅ Building registered successfully!', buildingId: generatedId };
  },

  async registerCompany(input: CompanyRegisterInput): Promise<AuthResult & { companyId?: number }> {
    const exists = await authAdapter.emailExists(input.email);
    if (exists) return { ok: false, message: '❌ Email already registered.' };

    const { data: haulerData, error: haulerError } = await authAdapter.insertHauler({
      business_name: input.companyName, license_number: input.licenseNumber,
      operating_address: input.operatingAddress, contact_number: input.contactNumber,
    });
    if (haulerError || !haulerData) return { ok: false, message: '❌ Failed to create company: ' + (haulerError?.message || 'unknown') };

    // Supabase Auth signup. Metadata flows to the on_auth_user_created trigger,
    // which creates the profiles row with company_id + role.
    let authId: string | null = null; let needsConfirm = false;
    try {
      const { data, error } = await supabaseAuth.signUp(input.email, input.password, {
        companyId: haulerData.id,
        role: 'company',
      });
      if (!error && data.user) {
        authId = data.user.id;
        needsConfirm = !data.session;
      }
    } catch { /* fall back to legacy-only row */ }

    const { error: userError } = await authAdapter.insertUser({
      email: input.email, password: authId ? null : input.password, auth_id: authId,
      account_type: 'WasteCompany', company_name: input.companyName,
      license_number: input.licenseNumber, company_id: haulerData.id,
    });
    if (userError) return { ok: false, message: 'Registration failed: ' + userError.message };
    return {
      ok: true, companyId: haulerData.id,
      message: needsConfirm ? '✅ Account created! Check your email to confirm your address, then sign in.' : '✅ Waste Company account created!',
    };
  },

  async resetCaretakerPasscode(buildingId: string, officialAddress: string, newPasscode: string) {
    const building = await authAdapter.queryBuildingByIdAndAddress(buildingId.trim(), officialAddress.trim());
    if (!building) return { ok: false, message: '❌ Building ID and address do not match our records.' };
    await authAdapter.updateBuildingPasscode(building.trim(), newPasscode);
    return { ok: true, message: '✅ Passcode updated!', building: { ...building, passcode: newPasscode } };
  },

  restoreSession(): void {
    try {
      const c = localStorage.getItem(KEYS.caretaker);
      if (c) { useAuthStore.getState().setSession('caretaker', JSON.parse(c)); return; }
      const co = localStorage.getItem(KEYS.company);
      if (co) { useAuthStore.getState().setSession('company', JSON.parse(co)); return; }
      const d = localStorage.getItem(KEYS.driver);
      if (d) { useAuthStore.getState().setSession('driver', JSON.parse(d)); return; }
      useAuthStore.getState().clearSession();
    } catch { useAuthStore.getState().clearSession(); }
  },

  signOut(): void {
    localStorage.removeItem(KEYS.caretaker); localStorage.removeItem(KEYS.company); localStorage.removeItem(KEYS.driver);
    useAuthStore.getState().clearSession();
    supabaseAuth.signOut().catch(() => {});
  },

  getRole(): Role | null { return useAuthStore.getState().role; },
};
import { authAdapter } from './authAdapter';
import { useAuthStore } from '@/lib/store/authStore';
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
    if (input.accountType === 'Caretaker') {
      const building = await authAdapter.queryBuildingByIdPasscode((input.buildingId || '').trim(), (input.passcode || '').trim());
      if (!building) return { ok: false, message: '❌ Invalid Building ID or Passcode' };
      localStorage.setItem(KEYS.caretaker, JSON.stringify(building));
      useAuthStore.getState().setSession('caretaker', building);
      return { ok: true, message: '✅ Login successful! Redirecting...', role: 'caretaker' };
    }
    const res = await authAdapter.queryUserByCredentials((input.email || '').trim(), (input.password || '').trim());
    if (!res) return { ok: false, message: '❌ Invalid ID/Email or password' };
    if (res.accountType === 'WasteCompany') {
      localStorage.setItem(KEYS.company, JSON.stringify(res.user));
      useAuthStore.getState().setSession('company', res.user);
      return { ok: true, message: '✅ Login successful! Redirecting...', role: 'company' };
    }
    localStorage.setItem(KEYS.driver, JSON.stringify(res.user));
    useAuthStore.getState().setSession('driver', res.user);
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
    await authAdapter.insertServiceRequest({
      request_number: requestNumber, building_id: generatedId, caretaker_name: 'Caretaker',
      status: 'pending', submitted_at: new Date().toISOString(),
    });

    const matchedCompanyId = await authAdapter.matchBuilding({
      officialAddress: input.officialAddress, estate: input.estate,
      coords: { lat: input.latitude, lon: input.longitude },
    });
    if (matchedCompanyId) {
      await authAdapter.assignServiceRequest(generatedId, matchedCompanyId);
      await authAdapter.setBuildingCompany(generatedId, matchedCompanyId);
    }
    return { ok: true, message: '✅ Building registered successfully!', buildingId: generatedId };
  },

  async registerCompany(input: CompanyRegisterInput): Promise<AuthResult> {
    const exists = await authAdapter.emailExists(input.email);
    if (exists) return { ok: false, message: '❌ Email already registered.' };
    const { data: haulerData, error: haulerError } = await authAdapter.insertHauler({
      business_name: input.companyName, license_number: input.licenseNumber,
      operating_address: input.operatingAddress, contact_number: input.contactNumber,
    });
    if (haulerError || !haulerData) return { ok: false, message: '❌ Failed to create company: ' + (haulerError?.message || 'unknown') };
    const { error: userError } = await authAdapter.insertUser({
      email: input.email, password: input.password, account_type: 'WasteCompany',
      company_name: input.companyName, license_number: input.licenseNumber, company_id: haulerData.id,
    });
    if (userError) return { ok: false, message: 'Registration failed: ' + userError.message };
    return { ok: true, message: '✅ Waste Company account created!' };
  },

  // restores the session from the SAME localStorage keys the dashboards already read
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
    localStorage.removeItem(KEYS.caretaker);
    localStorage.removeItem(KEYS.company);
    localStorage.removeItem(KEYS.driver);
    useAuthStore.getState().clearSession();
  },

  getRole(): Role | null { return useAuthStore.getState().role; },
};
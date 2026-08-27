import { supabase } from './supabase';
import type { Building, Collection, CollectionSchedule, Invoice, AppNotification } from '../types/caretaker';

// Inline type since ServiceRequest isn't exported from types/caretaker
interface ServiceRequest {
  id: number | string;
  request_number: string;
  building_id: string;
  company_id: number;
  caretaker_name: string;
  caretaker_phone: string;
  remarks: string;
  priority?: string;
  status?: string;
  submitted_at?: string;
  address?: string | null;
}

// ── BACKEND URL ─────────────────────────────────────────────
export const API_BASE = 'https://trakbin.vercel.app';

async function safeJson(res: Response) {
  const txt = await res.text();
  try {
    return JSON.parse(txt);
  } catch {
    throw new Error(`Backend returned non-JSON. Check API_BASE. (${txt.slice(0, 60)})`);
  }
}

// ── BUILDINGS ───────────────────────────────────────────────
export async function fetchBuildingByCustomId(customId: string): Promise<Building | null> {
  const { data } = await supabase.from('Buildings').select('*').eq('custom_id', customId).maybeSingle();
  return data as Building | null;
}

export async function fetchBuildingByEmail(email: string): Promise<Building | null> {
  const { data } = await supabase.from('Buildings').select('*').eq('caretaker_email', email).maybeSingle();
  return data as Building | null;
}

// ── SCHEDULES & COLLECTIONS ─────────────────────────────────
export async function fetchSchedules(customId: string, companyId: number): Promise<CollectionSchedule[]> {
  const { data } = await supabase
    .from('collection_schedules')
    .select('*')
    .eq('building_id', customId)
    .eq('company_id', companyId);
  return (data as CollectionSchedule[]) ?? [];
}

export async function fetchCollections(customId: string, companyId: number): Promise<Collection[]> {
  const { data } = await supabase
    .from('collections')
    .select('*')
    .eq('building_id', customId)
    .eq('company_id', companyId)
    .order('collection_date', { ascending: false })
    .limit(40);
  return (data as Collection[]) ?? [];
}

export async function fetchAllCollections(customId: string): Promise<Collection[]> {
  const { data } = await supabase
    .from('collections')
    .select('*')
    .eq('building_id', customId)
    .order('collection_date', { ascending: false });
  return (data as Collection[]) ?? [];
}

// ── INVOICES ────────────────────────────────────────────────
export async function fetchInvoices(customId: string, companyId: number): Promise<Invoice[]> {
  const { data } = await supabase
    .from('invoices')
    .select('*')
    .eq('building_id', customId)
    .eq('company_id', companyId)
    .order('due_date', { ascending: false });
  return (data as Invoice[]) ?? [];
}

// ── SERVICE REQUESTS ────────────────────────────────────────
export async function fetchServiceRequests(customId: string): Promise<ServiceRequest[]> {
  const { data } = await supabase
    .from('service_requests')
    .select('*')
    .eq('building_id', customId)
    .order('submitted_at', { ascending: false });
  return (data as ServiceRequest[]) ?? [];
}

export async function createServiceRequest(req: {
  customId: string;
  companyId: number;
  caretaker_name: string;
  caretaker_phone: string;
  remarks: string;
  priority?: string;
  address?: string | null;
}) {
  const request_number = `REQ-${Date.now().toString().slice(-6)}`;
  const { error } = await supabase.from('service_requests').insert([{
    request_number,
    building_id: req.customId,
    company_id: req.companyId,
    caretaker_name: req.caretaker_name,
    caretaker_phone: req.caretaker_phone,
    remarks: req.remarks,
    priority: req.priority ?? 'normal',
    address: req.address,
  }]);
  return { ok: !error, error: error?.message };
}

// ── NOTIFICATIONS ───────────────────────────────────────────
export async function fetchNotifications(customId: string): Promise<AppNotification[]> {
  const { data } = await supabase
    .from('notifications')
    .select('*')
    .eq('building_id', customId)
    .order('created_at', { ascending: false });
  return (data as AppNotification[]) ?? [];
}

export async function markNotificationsRead(ids: (string | number)[]) {
  if (!ids.length) return;
  await supabase.from('notifications').update({ is_read: true }).in('id', ids);
}

// ── PAYMENTS ────────────────────────────────────────────────
export async function settleInvoice(invoiceId: string | number): Promise<any> {
  const { data, error } = await supabase.rpc('settle_invoice', {
    p_invoice_id: String(invoiceId),
    p_idempotency_key: `settle-${invoiceId}`,
    p_source: 'wallet',
  });
  if (error) return { ok: false, reason: 'rpc_error', error: error.message };
  return (data ?? {}) as any;
}

export async function setAutopay(customId: string, enabled: boolean, source?: string) {
  const update: any = { autopay_enabled: enabled };
  if (source) update.autopay_source = source;
  const { error } = await supabase.from('Buildings').update(update).eq('custom_id', customId);
  return { ok: !error, error: error?.message };
}

export async function addCardMethod(p: {
  buildingId: string;
  companyId: number;
  brand: string;
  last4: string;
  holder: string;
}) {
  const { error } = await supabase.from('payment_methods').insert([{
    building_id: p.buildingId,
    company_id: p.companyId,
    instrument_type: 'card',
    provider: 'paystack',
    country: 'NG',
    currency: 'NGN',
    bank_name: p.brand,
    account_number: `**** ${p.last4}`,
    account_name: p.holder || 'Card',
    is_default: false,
  }]);
  return { ok: !error, error: error?.message };
}

export async function deletePaymentMethod(id: number | string) {
  const { error } = await supabase.from('payment_methods').delete().eq('id', id);
  return { ok: !error, error: error?.message };
}

export async function fetchLedger(customId: string): Promise<any[]> {
  const { data } = await supabase
    .from('ledger_transactions')
    .select('*')
    .eq('building_id', customId)
    .order('created_at', { ascending: false })
    .limit(40);
  return (data as any[]) ?? [];
}

// ── PAYSTACK CARD-SAVE FLOW ─────────────────────────────────
export async function initializeCardSave(buildingId: string, email: string) {
  const res = await fetch(`${API_BASE}/api/payments/initialize`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      buildingId,
      email,
      amount: 1,
      purpose: 'card_save',
      method: 'card',
      provider: 'paystack',
    }),
  });
  const json = await safeJson(res);
  if (!json.ok) throw new Error(json.error ?? 'Initialize failed');
  return { reference: json.reference, authorizationUrl: json.authorizationUrl };
}

export async function verifyPayment(reference: string) {
  const res = await fetch(`${API_BASE}/api/payments/verify?reference=${encodeURIComponent(reference)}`);
  return safeJson(res);
}
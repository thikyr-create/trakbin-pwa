// src/services/caretaker.ts
import { supabase } from './supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Building, Collection, CollectionSchedule, Invoice, AppNotification, CaretakerNotificationKind } from '../types/caretaker';

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

// NEW: Look up building by caretaker UUID (no email parsing needed)
export async function fetchBuildingByUserId(userId: string): Promise<Building | null> {
  const { data } = await supabase
    .from('Buildings')
    .select('*')
    .eq('caretaker_id', userId)
    .maybeSingle();
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

// ── NOTIFICATIONS (4-Table Read Model) ──────────────────────
export async function fetchCaretakerNotifications(
  buildingId: string,
  companyName?: string | null
): Promise<AppNotification[]> {
  const weekAgo = new Date(Date.now() - 7 * 864e5).toISOString();
  const out: AppNotification[] = [];

  const [stopsRes, issuesRes, invoicesRes, assignRes] = await Promise.all([
    supabase
      .from('route_stops')
      .select('id, completion_time, disputed')
      .eq('building_id', buildingId)
      .eq('status', 'completed')
      .gte('completion_time', weekAgo),
    supabase
      .from('environmental_issues')
      .select('id, issue_type, status, updated_at')
      .eq('building_id', buildingId)
      .neq('status', 'pending')
      .gte('updated_at', weekAgo),
    supabase
      .from('invoices')
      .select('id, amount, status, description, created_at')
      .eq('building_id', buildingId)
      .eq('status', 'paid')
      .gte('created_at', weekAgo),
    supabase
      .from('service_assignments')
      .select('id, created_at, service_status')
      .eq('building_id', buildingId)
      .eq('service_status', 'active')
      .gte('created_at', weekAgo),
  ]);

  (stopsRes.data || []).forEach((s: any) =>
    out.push({
      id: `pickup-${s.id}`,
      kind: s.disputed ? 'pickup_disputed' : 'pickup',
      label: s.disputed ? 'Pickup disputed' : 'Pickup completed',
      sub: s.disputed ? 'Reported to your waste company' : 'Confirm or dispute this pickup',
      at: s.completion_time,
      refId: s.id,
      disputed: !!s.disputed,
    })
  );

  (issuesRes.data || []).forEach((i: any) =>
    out.push({
      id: `issue-${i.id}`,
      kind: 'issue_update',
      label: i.status === 'resolved' ? 'Your report was resolved' : `Report ${i.status}`,
      sub: i.issue_type,
      at: i.updated_at,
      refId: null,
      disputed: false,
    })
  );

  (invoicesRes.data || []).forEach((v: any) =>
    out.push({
      id: `invoice-${v.id}`,
      kind: 'invoice_paid',
      label: 'Invoice settled',
      sub: `₦${Number(v.amount || 0).toLocaleString()} · ${v.description || 'Monthly collection'}`,
      at: v.created_at,
      refId: null,
      disputed: false,
    })
  );

  (assignRes.data || []).forEach((a: any) =>
    out.push({
      id: `service-${a.id}`,
      kind: 'service_activated',
      label: 'Service activated',
      sub: companyName ? `Provider: ${companyName}` : 'Your waste provider is now active',
      at: a.created_at ?? new Date().toISOString(),
      refId: null,
      disputed: false,
    })
  );

  out.sort((a, b) => (b.at || '').localeCompare(a.at || ''));
  return out.slice(0, 20);
}

export async function disputePickup(stopId: string, note?: string) {
  return supabase
    .from('route_stops')
    .update({ disputed: true, disputed_at: new Date().toISOString(), dispute_note: note || null })
    .eq('id', stopId);
}

export async function getSeenAt(buildingId: string): Promise<string | null> {
  return AsyncStorage.getItem(`trakbin_caretaker_notif_seen_${buildingId}`);
}

export async function setSeenAt(buildingId: string, iso: string) {
  await AsyncStorage.setItem(`trakbin_caretaker_notif_seen_${buildingId}`, iso);
}

// ── PAYMENTS ────────────────────────────────────────────────
export async function settleInvoice(invoiceId: number | string) {
  const res = await fetch(`${API_BASE}/api/payments/settle`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ invoiceId }),
  });
  return safeJson(res);
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
    card_brand: p.brand,
    card_last_four: p.last4,
    account_name: p.holder || 'Card',
    account_last4: p.last4,
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

export async function saveCardMethod(p: {
  buildingId: string;
  cardLast4: string;
  cardBrand: string;
  isDefault?: boolean;
  metadata?: any;
}) {
  const res = await fetch(`${API_BASE}/api/payment-methods`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      buildingId: p.buildingId,
      instrumentType: 'card',
      provider: 'paystack',
      type: 'card',
      cardLast4: p.cardLast4,
      cardBrand: p.cardBrand,
      is_default: p.isDefault ?? false,
    }),
  });
  return safeJson(res);
}

export async function setDefaultMethod(id: number | string, buildingId: string) {
  await supabase.from('payment_methods').update({ is_default: false }).eq('building_id', buildingId);
  const { error } = await supabase.from('payment_methods').update({ is_default: true }).eq('id', id);
  return { ok: !error, error: error?.message };
}

// ── ENVIRONMENTAL ISSUES (PWA ReportConsole) ────────────────
export async function createEnvironmentalIssue(p: {
  buildingId: string;
  companyId: number | null;
  issue_type: 'illegal_dumping' | 'missed_collection';
  description: string;
  location?: string;
  latitude?: number;
  longitude?: number;
  photo_url?: string;
  media?: string[];
  missed_date?: string;
  missed_window?: string | null;
}) {
  const issue_number = `ENV-${Date.now().toString().slice(-6)}-${Math.floor(Math.random() * 90 + 10)}`;

  const { data, error } = await supabase
    .from('environmental_issues')
    .insert([{
      issue_number,
      building_id: p.buildingId,
      reported_by: p.buildingId,
      company_id: p.companyId ?? null,
      issue_type: p.issue_type,
      description: p.description,
    }])
    .select('id')
    .single();
  if (error || !data) return { ok: false, error: error?.message ?? 'insert_failed' };

  const id = data.id;

  const touch = async (patch: Record<string, any>) => {
    try { await supabase.from('environmental_issues').update(patch).eq('id', id); } catch {}
  };

  await touch({ status: 'open' });
  if (p.location) await touch({ location: p.location });
  if (p.latitude != null) await touch({ latitude: p.latitude });
  if (p.longitude != null) await touch({ longitude: p.longitude });
  if (p.photo_url) await touch({ photo_url: p.photo_url });
  if (p.media?.length) await touch({ media: p.media });
  if (p.missed_date) await touch({ missed_date: p.missed_date });
  if (p.missed_window) await touch({ missed_window: p.missed_window });

  try {
    await supabase.from('environmental_issue_history').insert([{
      issue_id: id,
      action: 'REPORT_CREATED',
      performed_by: 'caretaker',
      metadata: { type: p.issue_type },
    }]);
  } catch {}

  return { ok: true, id, issue_number };
}

export async function fetchEnvironmentalIssues(buildingId: string) {
  const { data } = await supabase
    .from('environmental_issues')
    .select('*')
    .eq('building_id', buildingId)
    .in('issue_type', ['illegal_dumping', 'missed_collection'])
    .order('created_at', { ascending: false });
  return (data as any[]) ?? [];
}

// ── ON-DEMAND PICKUP REQUESTS ───────────────────────────────
export type PickupStatus =
  | 'REQUESTED' | 'UNDER_REVIEW' | 'APPROVED' | 'INVOICE_SENT' | 'PAYMENT_PENDING'
  | 'PAID' | 'ASSIGNED' | 'IN_PROGRESS' | 'COMPLETED'
  | 'REJECTED' | 'CANCELLED' | 'EXPIRED' | 'PAYMENT_FAILED';

export async function createPickupRequest(p: {
  buildingId: string; companyId: number | null;
  requestedDate: string; reason: string; notes?: string; timeWindow?: string;
}) {
  const request_number = `PKP-${Date.now().toString().slice(-6)}`;
  const { data, error } = await supabase.from('pickup_requests').insert([{
    request_number,
    building_id: p.buildingId,
    company_id: p.companyId ?? null,
    requested_date: p.requestedDate,
    time_window: p.timeWindow ?? null,
    reason: p.reason,
    notes: p.notes ?? null,
    status: 'REQUESTED',
  }]).select('id').single();
  return { ok: !error, id: data?.id, request_number, error: error?.message };
}

export async function fetchPickupRequests(buildingId: string) {
  const { data } = await supabase
    .from('pickup_requests').select('*')
    .eq('building_id', buildingId)
    .order('created_at', { ascending: false });
  return (data as any[]) ?? [];
}

export async function fetchUserNotifications() {
  const { data: session } = await supabase.auth.getSession();
  const userId = session?.session?.user?.id;
  if (!userId) return { ok: true, notifications: [] };
  const res = await fetch(`${API_BASE}/api/notifications?userId=${encodeURIComponent(userId)}`);
  return safeJson(res);
}

export async function markNotificationRead(notificationId: string) {
  const res = await fetch(`${API_BASE}/api/notifications`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ notificationId }),
  });
  return safeJson(res);
}
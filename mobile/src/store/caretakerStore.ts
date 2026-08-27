import { create } from 'zustand';
import { supabase } from '../services/supabase';
import * as svc from '../services/caretaker';
import type { AppNotification, Building, Collection, CollectionSchedule, Invoice } from '../types/caretaker';

interface Contact { type: string; label: string; value: string; }

interface CaretakerState {
  building: Building | null;
  company: any | null;
  companyDetails: any | null;
  contacts: Contact[];
  zone: { name: string } | null;
  assignment: any | null;
  schedules: CollectionSchedule[];
  collections: Collection[];
  invoices: Invoice[];
  invoiceCount: { paid: number; due: number };
  outstandingTotal: number;
  nextDueDate: string | null;
  notifications: AppNotification[];
  paymentMethods: any[];
  requests: any[];
  loading: boolean;
  loaded: boolean;
  unreadCount: number;
  load: (force?: boolean) => Promise<void>;
  markAllRead: () => Promise<void>;
}

// Mirrors the PWA's synthesizeContacts exactly
function synthesizeContacts(company: any, profile: any): Contact[] {
  const list: Contact[] = [];
  const seen = new Set<string>();
  const push = (c: Contact) => {
    const key = `${c.type}:${String(c.value).replace(/\s/g, '')}`;
    if (!c.value || seen.has(key)) return;
    seen.add(key);
    list.push(c);
  };
  if (Array.isArray(profile?.contact_numbers)) {
    profile.contact_numbers.forEach((c: any) => {
      if (c?.value) push({ type: c.type || 'call', label: c.label || 'Contact', value: String(c.value) });
    });
  }
  if (profile?.whatsapp_number) push({ type: 'whatsapp', label: 'WhatsApp', value: String(profile.whatsapp_number) });
  if (profile?.support_email) push({ type: 'email', label: 'Support Email', value: String(profile.support_email) });
  if (list.length === 0 && company?.contact_number) push({ type: 'call', label: 'Main Line', value: String(company.contact_number) });
  return list;
}

export const useCaretakerStore = create<CaretakerState>((set, get) => ({
  building: null,
  company: null,
  companyDetails: null,
  contacts: [],
  zone: null,
  assignment: null,
  schedules: [],
  collections: [],
  invoices: [],
  invoiceCount: { paid: 0, due: 0 },
  outstandingTotal: 0,
  nextDueDate: null,
  notifications: [],
  paymentMethods: [],
  requests: [],
  loading: false,
  loaded: false,
  unreadCount: 0,

  load: async (force = false) => {
    if (get().loading || (get().loaded && !force)) return;
    set({ loading: true });
    try {
      const { data } = await supabase.auth.getSession();
      const user = data.session?.user;
      if (!user) {
        set({ loading: false, loaded: true });
        return;
      }

      // Identity resolution: metadata → synthetic-email parse → caretaker_email fallback
      const metaId = (user.user_metadata as any)?.building_id as string | undefined;
      const email = user.email ?? '';
      const SYNTH_SUFFIX = '@caretaker.trakbin.app';
      const parsedId =
        email.toLowerCase().startsWith('b-') && email.toLowerCase().endsWith(SYNTH_SUFFIX)
          ? email.slice(2, email.length - SYNTH_SUFFIX.length).toUpperCase()
          : null;

      let building: Building | null = null;
      if (metaId) building = await svc.fetchBuildingByCustomId(metaId);
      if (!building && parsedId) building = await svc.fetchBuildingByCustomId(parsedId);
      if (!building) building = await svc.fetchBuildingByEmail(email);

      if (!building || !building.custom_id) {
        set({ loading: false, loaded: true });
        return;
      }

      const cid = Number(building.company_id) || 0;
      const custom = building.custom_id;

      // Mirror the PWA's exact Promise.all — real backend, no guessing
      const [
        schedules,
        collections,
        invoices,
        notifications,
        methodsResult,
        requests,
        assignmentRes,
        detailsRes,
      ] = await Promise.all([
        svc.fetchSchedules(custom, cid),
        svc.fetchCollections(custom, cid),
        svc.fetchInvoices(custom, cid),
        svc.fetchNotifications(custom),
        supabase.from('payment_methods').select('*').eq('building_id', custom).eq('company_id', cid),
        svc.fetchServiceRequests(custom),
        supabase
          .from('service_assignments')
          .select('*')
          .eq('building_id', custom)
          .eq('service_status', 'active')
          .maybeSingle(),
        supabase.from('company_profiles').select('*').eq('company_id', cid).maybeSingle(),
      ]);

      // PWA pattern: haulers (company) + zone via exact zone_id join
      let company: any = null;
      let zone: { name: string } | null = null;
      if (assignmentRes.data) {
        const [companyRes, zoneRes] = await Promise.all([
          supabase.from('haulers').select('*').eq('id', assignmentRes.data.company_id).maybeSingle(),
          assignmentRes.data.zone_id
            ? supabase
                .from('company_zones')
                .select('zone_name')
                .eq('id', assignmentRes.data.zone_id)
                .maybeSingle()
            : supabase
                .from('company_zones')
                .select('zone_name')
                .eq('company_id', assignmentRes.data.company_id)
                .maybeSingle(),
        ]);
                company = companyRes.data;
        zone = zoneRes.data
          ? { name: zoneRes.data.zone_name }
          : assignmentRes.data.zone_id
            ? { name: String(assignmentRes.data.zone_id) }
            : null;
      }

      const contacts = synthesizeContacts(company, detailsRes.data);

      const paid = invoices.filter((i) => i.status === 'paid').length;
      const due = invoices.filter((i) => i.status !== 'paid' && i.status !== 'cancelled').length;
      const outstandingTotal = invoices
        .filter((i) => i.status !== 'paid' && i.status !== 'cancelled')
        .reduce((s, i) => s + (i.amount ?? 0), 0);
      const nextDueDate =
        invoices
          .filter((i) => i.status !== 'paid' && i.status !== 'cancelled' && i.due_date)
          .map((i) => i.due_date as string)
          .sort()[0] ?? null;

      set({
        building,
        company,
        companyDetails: detailsRes.data,
        contacts,
        zone,
        assignment: assignmentRes.data ?? null,
        schedules,
        collections,
        invoices,
        invoiceCount: { paid, due },
        outstandingTotal,
        nextDueDate,
        notifications,
        paymentMethods: (methodsResult.data as any[]) ?? [],
        requests,
        unreadCount: notifications.filter((n) => !n.read && !n.is_read).length,
        loading: false,
        loaded: true,
      });
    } catch {
      set({ loading: false, loaded: true });
    }
  },

  markAllRead: async () => {
    const ids = get().notifications.filter((n) => !n.read && !n.is_read).map((n) => n.id);
    await svc.markNotificationsRead(ids);
    set({
      notifications: get().notifications.map((n) => ({ ...n, read: true, is_read: true })),
      unreadCount: 0,
    });
  },
}));
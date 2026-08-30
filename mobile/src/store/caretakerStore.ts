// src/store/caretakerStore.ts
import { create } from 'zustand';
import { supabase } from '../services/supabase';
import * as svc from '../services/caretaker';
import type { AppNotification, Building, Collection, CollectionSchedule, Invoice } from '../types/caretaker';
import { fetchUserNotifications } from '../services/caretaker';

interface Contact { type: string; label: string; value: string; }

let notifChannel: any = null;

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
  refreshNotifications: () => Promise<void>;
  markAllRead: () => Promise<void>;
  disputePickup: (stopId: string, note?: string) => Promise<{ ok: boolean; error?: string }>;
}

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
        if (notifChannel) { supabase.removeChannel(notifChannel); notifChannel = null; }
        set({ loading: false, loaded: true });
        return;
      }

      const cid = Number(building.company_id) || 0;
      const custom = building.custom_id;

      const [
        schedules,
        collections,
        invoices,
        methodsResult,
        requests,
        assignmentRes,
        detailsRes,
      ] = await Promise.all([
        svc.fetchSchedules(custom, cid),
        svc.fetchCollections(custom, cid),
        svc.fetchInvoices(custom, cid),
        supabase.from('payment_methods').select('*').eq('building_id', custom),
        svc.fetchServiceRequests(custom),
        supabase
          .from('service_assignments')
          .select('*')
          .eq('building_id', custom)
          .eq('service_status', 'active')
          .maybeSingle(),
        supabase.from('company_profiles').select('*').eq('company_id', cid).maybeSingle(),
      ]);

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
      const companyName = company?.business_name || detailsRes.data?.business_name || null;

      const oldNotifications = await svc.fetchCaretakerNotifications(custom, companyName);
      const seenAt = await svc.getSeenAt(custom);

      // ── SURGICAL EDIT 1: fetch new pipeline notifications + merge ──
      let newNotifs: any[] = [];
      try {
        const notifRes = await fetchUserNotifications();
        newNotifs = (notifRes.notifications || []).map((n: any) => ({
          id: n.id,
          kind: n.type as any,
          label: n.title,
          sub: n.message,
          at: n.created_at,
          data: n.data,
          refId: null,
          disputed: false,
        }));
      } catch (e) {
        console.warn('new notifications fetch failed:', e);
      }
      const mergedNotifications = [...newNotifs, ...oldNotifications.filter((e: any) => !newNotifs.some((n: any) => n.id === e.id))];
      // ──────────────────────────────────────────────────────────────────

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
        notifications: mergedNotifications,  // ← was: notifications
        paymentMethods: (methodsResult.data as any[]) ?? [],
        requests,
        unreadCount: seenAt ? mergedNotifications.filter((n: any) => n.at > seenAt).length : mergedNotifications.length,
        loading: false,
        loaded: true,
      });

      // Register push token now that we have a user identity
      const userId = user.id;
      import('../services/push').then(({ registerPushToken }) => {
        registerPushToken(userId).catch(() => {});
      });
      // Setup Realtime Subscriptions
      if (notifChannel) { supabase.removeChannel(notifChannel); notifChannel = null; }
      notifChannel = supabase
        .channel(`caretaker_notifs_${custom}`)
        .on('postgres_changes' as any, { event: '*', schema: 'public', table: 'route_stops', filter: `building_id=eq.${custom}` }, () => get().refreshNotifications())
        // ── SURGICAL EDIT 3: environmental_issues also re-loads full state ──
        .on('postgres_changes' as any, { event: '*', schema: 'public', table: 'environmental_issues', filter: `building_id=eq.${custom}` }, () => {
          get().refreshNotifications();
          get().load(true);
        })
        // ───────────────────────────────────────────────────────────────────
        .on('postgres_changes' as any, { event: '*', schema: 'public', table: 'invoices', filter: `building_id=eq.${custom}` }, () => get().refreshNotifications())
        .on('postgres_changes' as any, { event: '*', schema: 'public', table: 'service_assignments', filter: `building_id=eq.${custom}` }, () => get().refreshNotifications())
        .subscribe();
    } catch (err) {
      // ── SURGICAL EDIT 1 (cleanup): old fetch was in catch — removed ──
      console.warn('load failed:', err);
      set({ loading: false, loaded: true });
    }
  },

  // ── SURGICAL EDIT 2: refreshNotifications reads both old + new sources ──
  refreshNotifications: async () => {
    const custom = get().building?.custom_id;
    if (!custom) return;
    const companyName = get().company?.business_name || get().companyDetails?.business_name || null;
    const [oldNotifs, newRes] = await Promise.all([
      svc.fetchCaretakerNotifications(custom, companyName),
      fetchUserNotifications().catch(() => ({ notifications: [] })),
    ]);
    const newNotifs = (newRes.notifications || []).map((n: any) => ({
      id: n.id,
      kind: n.type as any,
      label: n.title,
      sub: n.message,
      at: n.created_at,
      data: n.data,
      refId: null,
      disputed: false,
    }));
    const notifications = [...newNotifs, ...oldNotifs.filter((e: any) => !newNotifs.some((n: any) => n.id === e.id))];
    const seenAt = await svc.getSeenAt(custom);
    set({
      notifications,
      unreadCount: seenAt ? notifications.filter((n: any) => n.at > seenAt).length : notifications.length,
    });
  },
  // ───────────────────────────────────────────────────────────────────────

  markAllRead: async () => {
    const buildingId = get().building?.custom_id;
    if (!buildingId) return;
    const now = new Date().toISOString();
    await svc.setSeenAt(buildingId, now);
    set({ unreadCount: 0 });
  },

  disputePickup: async (stopId: string, note?: string) => {
    const { error } = await svc.disputePickup(stopId, note);
    if (error) return { ok: false, error: error.message };
    await get().refreshNotifications();
    return { ok: true };
  },
}));
"use client";

import { useEffect, useState } from 'react';
import {
  CalendarPlus, CheckCircle, XCircle, Truck, Loader2, CreditCard, User,
} from 'lucide-react';
import { useCompanySession } from '@/lib/store/useCompanySession';
import { supabaseBrowser } from '@/lib/supabaseBrowser';
import { AssignmentEngine } from '@/lib/core/assignment/AssignmentEngine';
import { availableDrivers } from '@/lib/core/assignment/DriverAllocator';
import { availableTrucks } from '@/lib/core/assignment/TruckAllocator';

type PickupRequest = {
  id: string;
  request_number: string;
  building_id: string;
  requested_date: string;
  reason: string;
  notes: string | null;
  status: string;
  fee_amount: number | null;
  invoice_id: number | null;
  driver_id: string | null;
  truck_id: string | null;
  created_at: string;
};

export default function PickupRequestsPage() {
  const { tenant, addNotification } = useCompanySession();
  const [requests, setRequests] = useState<PickupRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  // Per-request inputs (fee for review, driver/truck for dispatch)
  const [feeInputs, setFeeInputs] = useState<Record<string, string>>({});
  const [driverSel, setDriverSel] = useState<Record<string, string>>({});
  const [truckSel, setTruckSel] = useState<Record<string, string>>({});

  const [drivers, setDrivers] = useState<any[]>([]);
  const [trucks, setTrucks] = useState<any[]>([]);

  const cid = tenant.companyId;

  const load = async () => {
    if (!cid) return;
    setLoading(true);
    const { data } = await supabaseBrowser
      .from('pickup_requests')
      .select('*')
      .eq('company_id', cid)
      .in('status', ['REQUESTED', 'UNDER_REVIEW', 'APPROVED', 'INVOICE_SENT', 'PAID', 'ASSIGNED', 'IN_PROGRESS', 'COMPLETED'])
      .order('created_at', { ascending: false });
    setRequests((data as PickupRequest[]) || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, [cid]);

  useEffect(() => {
    if (!cid) return;
    (async () => {
      const [d, t] = await Promise.all([
        supabaseBrowser.from('drivers').select('*').eq('company_id', cid),
        supabaseBrowser.from('trucks').select('*').eq('company_id', cid),
      ]);
      setDrivers(d.data || []);
      setTrucks(t.data || []);
    })();
  }, [cid]);

  const setFee = (id: string, v: string) => setFeeInputs((p) => ({ ...p, [id]: v }));
  const setDrv = (id: string, v: string) => setDriverSel((p) => ({ ...p, [id]: v }));
  const setTrk = (id: string, v: string) => setTruckSel((p) => ({ ...p, [id]: v }));

  // ── APPROVE: set fee → create invoice → INVOICE_SENT → notify ──
  const approve = async (req: PickupRequest) => {
    const fee = parseInt(feeInputs[req.id] ?? '', 10);
    if (!fee || fee < 0) { addNotification('Enter a valid fee amount.', 'error'); return; }
    setBusyId(req.id);
    try {
      const { data: inv, error: invErr } = await supabaseBrowser
        .from('invoices')
        .insert({
          building_id: req.building_id,
          company_id: cid,
          amount: fee,
          due_date: req.requested_date,
          status: 'issued',
          description: `On-demand pickup · ${req.reason}`,
        })
        .select('id')
        .single();
      if (invErr) throw new Error(invErr.message);

      const { error: updErr } = await supabaseBrowser
        .from('pickup_requests')
        .update({ status: 'INVOICE_SENT', fee_amount: fee, invoice_id: inv.id })
        .eq('id', req.id);
      if (updErr) throw new Error(updErr.message);

      await supabaseBrowser.from('notifications').insert({
        user_id: req.building_id,
        title: 'Pickup request approved',
        body: `Your pickup was approved. Fee: ₦${fee.toLocaleString()}. Pay to confirm.`,
        read: false,
      });
      await supabaseBrowser.from('notifications').insert({
        company_id: cid,
        title: 'Invoice sent',
        body: `Invoice for ${req.building_id} sent. Awaiting payment.`,
        read: false,
      });

      addNotification(`Approved · ₦${fee.toLocaleString()} invoice sent.`, 'success');
      setBusyId(null);
      load();
    } catch (e: any) {
      addNotification(e.message || 'Approve failed.', 'error');
      setBusyId(null);
    }
  };

  // ── REJECT ──
  const reject = async (req: PickupRequest) => {
    setBusyId(req.id);
    try {
      await supabaseBrowser
        .from('pickup_requests')
        .update({ status: 'REJECTED', rejected_reason: 'Capacity or scheduling conflict' })
        .eq('id', req.id);

      await supabaseBrowser.from('notifications').insert({
        user_id: req.building_id,
        title: 'Pickup request rejected',
        body: 'Your provider could not accommodate this request.',
        read: false,
      });

      addNotification('Request rejected.', 'success');
      setBusyId(null);
      load();
    } catch (e: any) {
      addNotification(e.message || 'Reject failed.', 'error');
      setBusyId(null);
    }
  };

  // ── ASSIGN: paid request → driver + truck via AssignmentEngine ──
  const assign = async (req: PickupRequest) => {
    const dId = driverSel[req.id] ?? '';
    const tId = truckSel[req.id] ?? '';
    if (!dId || !tId) { addNotification('Select driver and truck.', 'error'); return; }
    setBusyId(req.id);
    try {
      const driver = drivers.find((d) => String(d.id) === dId);
      const truck = trucks.find((t) => String(t.id) === tId);
      if (!driver || !truck) throw new Error('Driver or truck not found.');

      // LegacyStop requires lat/lng — pull from Buildings
      const { data: bld } = await supabaseBrowser
        .from('Buildings')
        .select('latitude, longitude')
        .eq('custom_id', req.building_id)
        .maybeSingle();

      const res = await AssignmentEngine.assign({
        companyId: cid!,
        driver,
        truck,
        stops: [{
          building_id: req.building_id,
          lat: Number(bld?.latitude) || 0,
          lng: Number(bld?.longitude) || 0,
        }],
        assignedBy: 'dispatcher',
      });
      if (!res.ok) throw new Error(res.errors?.join(' ') || 'Assign failed.');

      await supabaseBrowser
        .from('pickup_requests')
        .update({
          status: 'ASSIGNED',
          driver_id: String(driver.id),
          truck_id: String(truck.id),
          assigned_at: new Date().toISOString(),
        })
        .eq('id', req.id);

      await supabaseBrowser.from('notifications').insert({
        user_id: req.building_id,
        title: 'Driver assigned',
        body: `Driver ${driver.full_name} with truck ${truck.truck_id} will collect on ${req.requested_date}.`,
        read: false,
      });

      addNotification(`Assigned to ${driver.full_name}.`, 'success');
      setBusyId(null);
      load();
    } catch (e: any) {
      addNotification(e.message || 'Assign failed.', 'error');
      setBusyId(null);
    }
  };

  const pending = requests.filter((r) => ['REQUESTED', 'UNDER_REVIEW', 'APPROVED', 'INVOICE_SENT'].includes(r.status));
  const ready = requests.filter((r) => r.status === 'PAID');
  const active = requests.filter((r) => ['ASSIGNED', 'IN_PROGRESS', 'COMPLETED'].includes(r.status));

  if (loading) {
    return (
      <div className="p-12 text-center">
        <Loader2 className="mx-auto h-8 w-8 animate-spin text-gray-400" />
        <p className="mt-3 text-sm font-semibold text-gray-500">Loading pickup requests…</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 border-b border-gray-200 pb-5">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 ring-1 ring-amber-200">
          <CalendarPlus className="h-6 w-6" />
        </div>
        <div>
          <p className="font-mono text-[11px] font-bold uppercase tracking-[0.22em] text-amber-600/80">On-demand pickups</p>
          <h2 className="text-xl font-black uppercase tracking-tight text-gray-900">Pickup Requests</h2>
        </div>
      </div>

      {/* ── AWAITING REVIEW ── */}
      <section className="overflow-hidden rounded-[20px] border border-gray-200/80 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-5">
          <h3 className="text-base font-extrabold text-gray-900">Awaiting review</h3>
          <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-gray-400">{pending.length} pending</span>
        </div>
        {pending.length === 0 ? (
          <p className="px-6 py-10 text-center text-sm font-semibold text-gray-400">No pickup requests awaiting review.</p>
        ) : (
          <ul className="divide-y divide-gray-100">
            {pending.map((req) => (
              <li key={req.id} className="px-6 py-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <p className="flex items-center gap-2 text-sm font-extrabold text-gray-900">
                      {req.request_number}
                      <span className={`rounded-full px-2 py-0.5 font-mono text-[9px] font-bold uppercase tracking-wider ring-1 ${
                        req.status === 'REQUESTED' ? 'bg-amber-50 text-amber-700 ring-amber-200'
                        : req.status === 'INVOICE_SENT' ? 'bg-sky-50 text-sky-700 ring-sky-200'
                        : 'bg-gray-50 text-gray-700 ring-gray-200'
                      }`}>{req.status}</span>
                    </p>
                    <p className="mt-1 text-xs font-semibold text-gray-500">
                      Building: {req.building_id} · Requested: {new Date(req.requested_date).toLocaleDateString('en-NG', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </p>
                    <p className="mt-1 text-xs font-medium text-gray-600">Reason: {req.reason}</p>
                    {req.notes ? <p className="mt-1 text-xs text-gray-500">Note: {req.notes}</p> : null}
                  </div>

                  <div className="flex w-40 flex-col gap-2">
                    {req.status === 'REQUESTED' || req.status === 'UNDER_REVIEW' ? (
                      <>
                        <input
                          type="number"
                          value={feeInputs[req.id] ?? ''}
                          onChange={(e) => setFee(req.id, e.target.value)}
                          placeholder="Fee (₦)"
                          className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm font-semibold outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-200"
                        />
                        <button
                          onClick={() => approve(req)}
                          disabled={busyId === req.id}
                          className="flex items-center justify-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-bold text-white shadow-md hover:bg-emerald-700 disabled:bg-gray-400"
                        >
                          {busyId === req.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <CheckCircle className="h-3 w-3" />}
                          Approve
                        </button>
                        <button
                          onClick={() => reject(req)}
                          disabled={busyId === req.id}
                          className="flex items-center justify-center gap-1.5 rounded-lg bg-gray-100 px-3 py-2 text-xs font-bold text-gray-700 hover:bg-gray-200 disabled:opacity-50"
                        >
                          {busyId === req.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <XCircle className="h-3 w-3" />}
                          Reject
                        </button>
                      </>
                    ) : req.status === 'INVOICE_SENT' ? (
                      <span className="rounded-full bg-sky-50 px-3 py-2 text-center text-[10px] font-bold uppercase tracking-wider text-sky-700 ring-1 ring-sky-200">Awaiting payment</span>
                    ) : null}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* ── READY FOR DISPATCH (PAID) ── */}
      <section className="overflow-hidden rounded-[20px] border border-gray-200/80 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-5">
          <h3 className="text-base font-extrabold text-gray-900">Ready for dispatch</h3>
          <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-gray-400">{ready.length} paid</span>
        </div>
        {ready.length === 0 ? (
          <p className="px-6 py-10 text-center text-sm font-semibold text-gray-400">No paid requests awaiting assignment.</p>
        ) : (
          <ul className="divide-y divide-gray-100">
            {ready.map((req) => (
              <li key={req.id} className="px-6 py-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <p className="flex items-center gap-2 text-sm font-extrabold text-gray-900">
                      {req.request_number}
                      <span className="rounded-full bg-emerald-50 px-2 py-0.5 font-mono text-[9px] font-bold uppercase tracking-wider text-emerald-700 ring-1 ring-emerald-200">PAID</span>
                    </p>
                    <p className="mt-1 text-xs font-semibold text-gray-500">
                      Building: {req.building_id} · Fee: ₦{(req.fee_amount ?? 0).toLocaleString()} · Date: {new Date(req.requested_date).toLocaleDateString('en-NG', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </p>
                    <p className="mt-1 text-xs font-medium text-gray-600">Reason: {req.reason}</p>
                  </div>

                  <div className="flex w-52 flex-col gap-2">
                    <select
                      value={driverSel[req.id] ?? ''}
                      onChange={(e) => setDrv(req.id, e.target.value)}
                      className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-xs font-semibold outline-none focus:border-emerald-400"
                    >
                      <option value="">Select driver…</option>
                      {availableDrivers(drivers).map((d) => (
                        <option key={d.id} value={d.id}>{d.full_name}</option>
                      ))}
                    </select>
                    <select
                      value={truckSel[req.id] ?? ''}
                      onChange={(e) => setTrk(req.id, e.target.value)}
                      className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-xs font-semibold outline-none focus:border-emerald-400"
                    >
                      <option value="">Select truck…</option>
                      {availableTrucks(trucks).map((t) => (
                        <option key={t.id} value={t.id}>{t.truck_id}</option>
                      ))}
                    </select>
                    <button
                      onClick={() => assign(req)}
                      disabled={busyId === req.id || !driverSel[req.id] || !truckSel[req.id]}
                      className="flex items-center justify-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-bold text-white shadow-md hover:bg-emerald-700 disabled:bg-gray-400"
                    >
                      {busyId === req.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Truck className="h-3 w-3" />}
                      Assign driver & truck
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* ── ACTIVE PICKUPS ── */}
      <section className="overflow-hidden rounded-[20px] border border-gray-200/80 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-5">
          <h3 className="text-base font-extrabold text-gray-900">Active pickups</h3>
          <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-gray-400">{active.length} in progress</span>
        </div>
        {active.length === 0 ? (
          <p className="px-6 py-10 text-center text-sm font-semibold text-gray-400">No active pickup assignments.</p>
        ) : (
          <ul className="divide-y divide-gray-100">
            {active.map((req) => (
              <li key={req.id} className="px-6 py-5">
                <p className="flex items-center gap-2 text-sm font-extrabold text-gray-900">
                  {req.request_number}
                  <span className={`rounded-full px-2 py-0.5 font-mono text-[9px] font-bold uppercase tracking-wider ring-1 ${
                    req.status === 'ASSIGNED' ? 'bg-emerald-50 text-emerald-700 ring-emerald-200'
                    : req.status === 'IN_PROGRESS' ? 'bg-sky-50 text-sky-700 ring-sky-200'
                    : 'bg-gray-50 text-gray-700 ring-gray-200'
                  }`}>{req.status}</span>
                </p>
                <p className="mt-1 text-xs font-semibold text-gray-500">
                  Building: {req.building_id} · Driver: {req.driver_id ?? '—'} · Truck: {req.truck_id ?? '—'}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
// app/waste-company-dashboard/components/PickupDisputesPanel.tsx
"use client";

import { useEffect, useState } from 'react';
import { supabaseBrowser } from '@/lib/supabaseBrowser';
import { motion } from 'framer-motion';
import { AlertTriangle, Truck, User } from 'lucide-react';
import { useCompanySession } from '@/lib/store/useCompanySession';

const supabase = supabaseBrowser;

export default function PickupDisputesPanel() {
  const { tenant } = useCompanySession();
  const [disputes, setDisputes] = useState<any[]>([]);

  const load = async () => {
    const cid = tenant.companyId; if (!cid) return;
    // Join route_stops with routes to get driver/truck info
    const { data } = await supabase
      .from('route_stops')
      .select(`
        id,
        building_id,
        disputed_at,
        dispute_note,
        routes!inner (
          id,
          driver_id,
          truck_id,
          created_at
        )
      `)
      .eq('company_id', cid)
      .eq('disputed', true)
      .order('disputed_at', { ascending: false })
      .limit(20);
    
    setDisputes(data || []);
  };

  useEffect(() => { if (tenant.loaded) load(); }, [tenant.loaded, tenant.companyId]);

  // Realtime: watch for new disputes
  useEffect(() => {
    if (!tenant.companyId) return;
    const channel = supabase
      .channel(`company-disputes-${tenant.companyId}`)
      .on(
        'postgres_changes' as any,
        { event: 'UPDATE', schema: 'public', table: 'route_stops', filter: `company_id=eq.${tenant.companyId}` },
        (payload: any) => {
          if (payload.new?.disputed === true) load();
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [tenant.companyId]);

  if (disputes.length === 0) return null;

  return (
    <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity:1, y: 0 }} transition={{ duration: 0.5 }} className="overflow-hidden rounded-[24px] border border-gray-200/80 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-gray-100 px-6 py-5">
        <h3 className="text-lg font-extrabold tracking-tight text-gray-900">Pickup Disputes</h3>
        <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-red-500">{disputes.length} active</span>
      </div>
      <ul className="divide-y divide-gray-100">
        {disputes.map((it: any) => (
          <li key={it.id} className="px-6 py-4">
            <div className="flex items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-600 ring-1 ring-red-100">
                <AlertTriangle className="h-5 w-5" />
              </span>
              <div className="flex-1">
                <p className="text-sm font-extrabold text-gray-900">
                  Building {it.building_id} disputed pickup
                </p>
                <p className="mt-0.5 text-xs font-medium text-gray-600">
                  {it.dispute_note || 'Caretaker reported pickup was not completed.'}
                </p>
                <div className="mt-1 flex flex-wrap items-center gap-3 text-[10px] font-semibold text-gray-400">
                  <span className="flex items-center gap-1"><User size={10} /> Driver: {it.routes?.driver_id}</span>
                  <span className="flex items-center gap-1"><Truck size={10} /> Truck: {it.routes?.truck_id}</span>
                  <span>{new Date(it.disputed_at).toLocaleString()}</span>
                </div>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </motion.section>
  );
}
"use client";

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, X, MapPin, TrendingUp } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';
import { useCompanySession } from '@/lib/store/useCompanySession';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

interface Correction {
  id: number;
  entity_type: string;
  entity_id: string;
  field: string;
  current_value: any;
  proposed_value: any;
  confidence: number;
  evidence_count: number;
  status: string;
  updated_at: string;
  company_id: number;
}

interface Intelligence {
  entity_type: string;
  entity_id: string;
  kind: string;
  value: any;
  confidence: number;
  sample_count: number;
  status: string;
  updated_at: string;
}

export default function FieldIntelligencePage() {
  const { tenant } = useCompanySession();
  const [corrections, setCorrections] = useState<Correction[]>([]);
  const [intelligence, setIntelligence] = useState<Intelligence[]>([]);
  const [tab, setTab] = useState<'corrections' | 'intelligence'>('corrections');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!tenant?.companyId) return;
    fetchData();

    const channel = supabase
      .channel('field_corrections_realtime')
      .on(
        'postgres_changes' as any,
        { event: '*', schema: 'public', table: 'field_corrections', filter: `company_id=eq.${tenant.companyId}` },
        () => { fetchData(); }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [tenant?.companyId]);

  const fetchData = async () => {
    if (!tenant?.companyId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/field-intelligence/corrections/list?companyId=${tenant.companyId}`);
      const data = await res.json();
      setCorrections(data.corrections || []);
      setIntelligence(data.intelligence || []);
    } catch (e) {
      console.error('[field-intelligence] fetch failed', e);
    }
    setLoading(false);
  };

  const handleApprove = async (id: number) => {
    await fetch('/api/field-intelligence/corrections/approve', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ correctionId: id, reviewedBy: 'admin' }),
    });
  };

  const handleReject = async (id: number) => {
    await fetch('/api/field-intelligence/corrections/reject', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ correctionId: id, reviewedBy: 'admin' }),
    });
  };

  const pending = corrections.filter((c) => c.status !== 'applied' && c.status !== 'rejected');
  const applied = corrections.filter((c) => c.status === 'applied');

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-100">
            <TrendingUp size={20} className="text-emerald-700" />
          </div>
          <div>
            <p className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400">Self-learning operations</p>
            <h2 className="text-lg font-black text-gray-900">Field Intelligence</h2>
          </div>
        </div>
        <div className="flex gap-3">
          <div className="rounded-xl bg-amber-50 px-3 py-2 ring-1 ring-amber-200">
            <p className="font-mono text-[10px] font-bold uppercase tracking-wider text-amber-600">Pending</p>
            <p className="text-xl font-black text-amber-700">{pending.length}</p>
          </div>
          <div className="rounded-xl bg-emerald-50 px-3 py-2 ring-1 ring-emerald-200">
            <p className="font-mono text-[10px] font-bold uppercase tracking-wider text-emerald-600">Applied</p>
            <p className="text-xl font-black text-emerald-700">{applied.length}</p>
          </div>
          <div className="rounded-xl bg-blue-50 px-3 py-2 ring-1 ring-blue-200">
            <p className="font-mono text-[10px] font-bold uppercase tracking-wider text-blue-600">Learned</p>
            <p className="text-xl font-black text-blue-700">{intelligence.length}</p>
          </div>
        </div>
      </div>

      <div className="flex gap-1 border-b border-gray-200">
        <button
          onClick={() => setTab('corrections')}
          className={`px-4 py-2 text-xs font-bold uppercase tracking-wide transition-colors ${
            tab === 'corrections'
              ? 'border-b-2 border-emerald-600 text-emerald-700'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Corrections ({pending.length})
        </button>
        <button
          onClick={() => setTab('intelligence')}
          className={`px-4 py-2 text-xs font-bold uppercase tracking-wide transition-colors ${
            tab === 'intelligence'
              ? 'border-b-2 border-emerald-600 text-emerald-700'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Learned Intelligence ({intelligence.length})
        </button>
      </div>

      {tab === 'corrections' && (
        <div className="space-y-3">
          {loading ? (
            <div className="py-12 text-center">
              <motion.div
                className="mx-auto h-8 w-8 rounded-full border-2 border-emerald-600 border-t-transparent"
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              />
              <p className="mt-3 text-sm text-gray-500">Loading corrections...</p>
            </div>
          ) : pending.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-gray-300 py-16 text-center">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100">
                <Check size={24} className="text-emerald-600" />
              </div>
              <p className="font-bold text-gray-700">No pending corrections</p>
              <p className="mt-1 text-sm text-gray-500">The system hasn't proposed any location or route corrections yet.</p>
            </div>
          ) : (
            <AnimatePresence>
              {pending.map((cor) => (
                <motion.div
                  key={cor.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-100">
                        <MapPin size={20} className="text-amber-700" />
                      </div>
                      <div>
                        <h3 className="font-black text-gray-900">
                          {cor.entity_type} <span className="font-mono text-sm">{cor.entity_id}</span>
                        </h3>
                        <p className="font-mono text-[10px] font-bold uppercase tracking-wider text-gray-400">
                          Field: {cor.field} · {cor.status.replace(/_/g, ' ')}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="font-mono text-[10px] font-bold uppercase tracking-wider text-gray-400">Confidence</p>
                        <p className="text-lg font-black text-emerald-700">{Math.round(cor.confidence * 100)}%</p>
                      </div>
                      <div className="text-right">
                        <p className="font-mono text-[10px] font-bold uppercase tracking-wider text-gray-400">Samples</p>
                        <p className="text-lg font-black text-blue-700">{cor.evidence_count}</p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="rounded-xl bg-gray-50 p-3 ring-1 ring-gray-200">
                      <p className="mb-1 font-mono text-[10px] font-bold uppercase tracking-wider text-gray-500">Current</p>
                      <pre className="text-xs text-gray-700 font-mono overflow-x-auto">
                        {JSON.stringify(cor.current_value, null, 2)}
                      </pre>
                    </div>
                    <div className="rounded-xl bg-emerald-50 p-3 ring-1 ring-emerald-200">
                      <p className="mb-1 font-mono text-[10px] font-bold uppercase tracking-wider text-emerald-700">Proposed</p>
                      <pre className="text-xs text-emerald-800 font-mono overflow-x-auto">
                        {JSON.stringify(cor.proposed_value, null, 2)}
                      </pre>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleApprove(cor.id)}
                      className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-600 py-2.5 text-sm font-bold text-white transition-colors hover:bg-emerald-500"
                    >
                      <Check size={16} /> Approve & Apply
                    </button>
                    <button
                      onClick={() => handleReject(cor.id)}
                      className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 py-2.5 text-sm font-bold text-red-700 transition-colors hover:bg-red-100"
                    >
                      <X size={16} /> Reject
                    </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          )}
        </div>
      )}

      {tab === 'intelligence' && (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
          {intelligence.length === 0 ? (
            <div className="col-span-full rounded-2xl border border-dashed border-gray-300 py-16 text-center">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
                <TrendingUp size={24} className="text-blue-600" />
              </div>
              <p className="font-bold text-gray-700">No learned intelligence yet</p>
              <p className="mt-1 text-sm text-gray-500">The system will learn from driver observations over time.</p>
            </div>
          ) : (
            intelligence.map((intel, i) => (
              <motion.div
                key={`${intel.entity_type}-${intel.entity_id}-${intel.kind}`}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.03 }}
                className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm"
              >
                <div className="mb-2 flex items-start justify-between">
                  <div>
                    <p className="font-mono text-[10px] font-bold uppercase tracking-wider text-gray-400">
                      {intel.entity_type}
                    </p>
                    <h3 className="font-black text-gray-900">{intel.entity_id}</h3>
                    <p className="font-mono text-[10px] font-bold uppercase tracking-wider text-emerald-700">
                      {intel.kind.replace(/_/g, ' ')}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-mono text-[10px] font-bold uppercase tracking-wider text-gray-400">Confidence</p>
                    <p className="text-lg font-black text-emerald-700">{Math.round(intel.confidence * 100)}%</p>
                  </div>
                </div>
                <div className="rounded-lg bg-gray-50 p-2 ring-1 ring-gray-200">
                  <pre className="overflow-x-auto text-[11px] text-gray-700 font-mono">
                    {JSON.stringify(intel.value, null, 2)}
                  </pre>
                </div>
                <p className="mt-2 font-mono text-[10px] font-bold uppercase tracking-wider text-gray-400">
                  {intel.sample_count} samples · {new Date(intel.updated_at).toLocaleDateString()}
                </p>
              </motion.div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
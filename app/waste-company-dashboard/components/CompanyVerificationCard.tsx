"use client";

import { useEffect, useState } from 'react';
import { supabaseBrowser } from '@/lib/supabaseBrowser';
import { motion } from 'framer-motion';
import { Sora, Plus_Jakarta_Sans, JetBrains_Mono } from 'next/font/google';
import { Mail, UserCheck, FileCheck2, CircleCheck, Loader2, Upload, ShieldCheck, TriangleAlert } from 'lucide-react';
import { getCompanyVerification } from '@/lib/auth/companyVerification';

const supabase = supabaseBrowser;
const display = Sora({ subsets: ['latin'], display: 'swap', variable: '--font-display' });
const body = Plus_Jakarta_Sans({ subsets: ['latin'], display: 'swap', variable: '--font-body' });
const mono = JetBrains_Mono({ subsets: ['latin'], display: 'swap', variable: '--font-mono' });
const EASE = [0.22, 1, 0.36, 1] as [number, number, number, number];

interface Props { companyId: string | number; }

export default function CompanyVerificationCard({ companyId }: Props) {
  const [hauler, setHauler] = useState<any>(null);
  const [uploading, setUploading] = useState(false);
  const [note, setNote] = useState('');

  const load = async () => {
    if (!companyId) return;
    const { data } = await supabase.from('haulers').select('*').eq('id', Number(companyId)).maybeSingle();
    setHauler(data);
  };
  useEffect(() => { load(); }, [companyId]);

  const v = getCompanyVerification(hauler);

  const uploadDocs = async (files: FileList | null) => {
    if (!files || files.length === 0 || !companyId) return;
    setUploading(true); setNote('');
    try {
      const urls: string[] = [];
      for (const f of Array.from(files)) {
        const path = `company-${companyId}/${Date.now()}-${f.name}`;
        const { error } = await supabase.storage.from('trakbin-company-docs').upload(path, f, { upsert: false });
        if (error) throw error;
        const { data } = supabase.storage.from('trakbin-company-docs').getPublicUrl(path);
        urls.push(data.publicUrl);
      }
      await supabase.from('haulers').update({ documents_urls: urls, documents_status: 'pending' }).eq('id', Number(companyId));
      setNote('âœ… Documents submitted â€” pending review. This does not block your operations.');
      load();
    } catch (e: any) { setNote('âŒ Upload failed: ' + (e?.message || 'unknown')); }
    finally { setUploading(false); }
  };

  const Row = ({ Icon, label, done, pending, optional, children }: any) => (
    <div className="flex items-start gap-3 rounded-xl border border-gray-100 bg-gray-50/60 p-3.5">
      <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ring-1 ${done ? 'bg-emerald-50 text-emerald-600 ring-emerald-100' : pending ? 'bg-amber-50 text-amber-600 ring-amber-100' : 'bg-gray-100 text-gray-400 ring-gray-200'}`}>
        {done ? <CircleCheck className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
      </span>
      <div className="min-w-0 flex-1">
        <p className="flex items-center gap-2 text-sm font-bold text-gray-900">{label}
          {optional && <span className="rounded-full bg-gray-100 px-2 py-0.5 font-mono text-[9px] font-bold uppercase tracking-wider text-gray-500 ring-1 ring-gray-200">optional</span>}
        </p>
        {children}
      </div>
      <span className={`mt-0.5 shrink-0 rounded-full px-2 py-0.5 font-mono text-[9px] font-bold uppercase tracking-wider ring-1 ${done ? 'bg-emerald-50 text-emerald-700 ring-emerald-200' : pending ? 'bg-amber-50 text-amber-700 ring-amber-200' : 'bg-gray-100 text-gray-500 ring-gray-200'}`}>
        {done ? 'done' : pending ? 'review' : optional ? 'â€”' : 'required'}
      </span>
    </div>
  );

  // COMPACT MODE: When cleared to operate, show minimal chip
  if (v.canOperate) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3, ease: EASE }}
        className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-4 py-2 ring-1 ring-emerald-200"
      >
        <ShieldCheck className="h-4 w-4 text-emerald-600" />
        <span className={`${mono.className} text-[11px] font-bold uppercase tracking-wider text-emerald-700`}>
          Cleared to operate
        </span>
      </motion.div>
    );
  }

  // FULL MODE: When action is needed, show the full verification card
  return (
    <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: EASE }} className="relative overflow-hidden rounded-[24px] border border-gray-200/80 bg-white p-6 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="font-mono text-[11px] font-bold uppercase tracking-[0.22em] text-emerald-600/80">Account verification</p>
          <h3 className={`${display.className} mt-1 text-xl font-extrabold tracking-tight text-gray-900`}>Your operator status</h3>
        </div>
        <span className="flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1.5 text-xs font-bold text-amber-700 ring-1 ring-amber-200">
          <TriangleAlert className="h-3.5 w-3.5" /> Action needed
        </span>
      </div>

      <p className="mb-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs font-semibold text-amber-800">
        Confirm your email and complete your profile to be cleared for accepting buildings and assigning drivers.
      </p>

      <div className="space-y-3">
        <Row Icon={Mail} label="Email verification" done={v.email}>
          <p className="text-xs font-medium text-gray-500">{v.email ? 'Your email is confirmed.' : 'Confirm the email we sent you, then sign in again.'}</p>
        </Row>

        <Row Icon={UserCheck} label="Profile completion" done={v.profile}>
          <p className="text-xs font-medium text-gray-500">{v.profile ? 'Business name, licence, address and contact are on file.' : 'Complete your business profile details.'}</p>
        </Row>

        <Row Icon={FileCheck2} label="Document verification" optional done={v.documents === 'approved'} pending={v.documents === 'pending'}>
          <p className="text-xs font-medium text-gray-500">
            {v.documents === 'approved' ? 'Business registration / licence approved.' :
             v.documents === 'pending' ? 'Documents submitted â€” pending review.' :
             'Upload your business registration or licence (optional).'}
          </p>
          <p className="mt-0.5 text-[11px] font-medium text-gray-400">Does not block accepting buildings or assigning drivers.</p>
          {v.documents !== 'approved' && (
            <label className={`mt-2 inline-flex cursor-pointer items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white transition-colors hover:bg-emerald-700 ${uploading ? 'opacity-60' : ''}`}>
              {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
              {uploading ? 'Uploadingâ€¦' : 'Upload documents'}
              <input type="file" multiple accept=".pdf,image/*" className="hidden" disabled={uploading} onChange={(e) => uploadDocs(e.target.files)} />
            </label>
          )}
        </Row>
      </div>

      {note && <p className={`mt-3 text-xs font-semibold ${note.includes('âŒ') ? 'text-red-600' : 'text-emerald-700'}`}>{note}</p>}
    </motion.section>
  );
}
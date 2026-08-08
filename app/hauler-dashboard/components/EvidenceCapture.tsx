// app/hauler-dashboard/components/EvidenceCapture.tsx (complete)
"use client";

import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, Video, Upload, X, Check, Loader2 } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';
import { recordActivity } from '@/lib/features/driver/activity';
import { useDriverSession } from '@/lib/store/useDriverSession';
import { useCompanySession } from '@/lib/store/useCompanySession';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

interface EvidenceCaptureProps {
  open: boolean;
  onClose: () => void;
  activityType: 'pickup' | 'skip' | 'report' | 'deviation';
  buildingId?: string | null;
  contextLabel?: string;
}

export default function EvidenceCapture({ open, onClose, activityType, buildingId, contextLabel }: EvidenceCaptureProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [done, setDone] = useState(false);
  const photoRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLInputElement>(null);
  const fileRef  = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files || []);
    setFiles((prev) => [...prev, ...selected]);
    selected.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => setPreviews((prev) => [...prev, reader.result as string]);
      reader.readAsDataURL(file);
    });
    if (photoRef.current) photoRef.current.value = '';
    if (videoRef.current) videoRef.current.value = '';
    if (fileRef.current)  fileRef.current.value  = '';
  };

  const removeFile = (i: number) => {
    setFiles((p) => p.filter((_, x) => x !== i));
    setPreviews((p) => p.filter((_, x) => x !== i));
  };

  const upload = async () => {
    if (files.length === 0) return;
    setUploading(true);

    const urls: string[] = [];
    for (const file of files) {
      const ext = file.name.split('.').pop() || 'bin';
      const path = `driver-evidence/${activityType}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const { error } = await supabase.storage.from('environmental-issues').upload(path, file, { upsert: false });
      if (!error) {
        const { data } = supabase.storage.from('environmental-issues').getPublicUrl(path);
        urls.push(data.publicUrl);
      }
    }

    // Publish the attached event — chain of truth preserved (append-only)
    if (urls.length > 0) {
      const { driver, driverCompanyId, gpsLocation } = useDriverSession.getState();
      const { tenant } = useCompanySession.getState();
      const cid = driverCompanyId ?? tenant.companyId;
      if (cid && driver) {
        await recordActivity({
          eventType: 'DRIVER_EVIDENCE_ATTACHED',
          driverId: driver.employee_id || driver.id,
          companyId: cid,
          buildingId: buildingId ?? null,
          latitude: gpsLocation?.lat ?? null,
          longitude: gpsLocation?.lng ?? null,
          metadata: { activityType, evidenceUrls: urls, count: urls.length, contextLabel },
        }).catch(() => {});
      }
    }

    setUploading(false);
    setDone(true);
  };

  const close = () => {
    setFiles([]); setPreviews([]); setDone(false); onClose();
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          onClick={close}
        >
          <motion.div
            initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
            transition={{ type: 'spring', damping: 24, stiffness: 300 }}
            className="bg-slate-900 rounded-2xl w-full max-w-md shadow-2xl border border-slate-800 overflow-hidden max-h-[90vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-5 border-b border-slate-800 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/15 text-blue-400"><Camera size={16} /></span>
                <div>
                  <h3 className="text-lg font-black text-white uppercase">Attach Evidence</h3>
                  {contextLabel && <p className="text-[10px] text-gray-500 font-bold">{contextLabel}</p>}
                </div>
              </div>
              <button onClick={close} className="p-1 hover:bg-slate-800 rounded-full"><X size={20} className="text-gray-400" /></button>
            </div>

            <div className="p-5 overflow-y-auto flex-1">
              {!done ? (
                <>
                  <div className="grid grid-cols-3 gap-2 mb-4">
                    <button onClick={() => photoRef.current?.click()} className="flex flex-col items-center gap-2 p-4 bg-slate-800 rounded-xl hover:bg-slate-700 transition-colors">
                      <Camera size={20} className="text-blue-400" />
                      <span className="text-xs font-bold text-gray-300">Photo</span>
                    </button>
                    <button onClick={() => videoRef.current?.click()} className="flex flex-col items-center gap-2 p-4 bg-slate-800 rounded-xl hover:bg-slate-700 transition-colors">
                      <Video size={20} className="text-purple-400" />
                      <span className="text-xs font-bold text-gray-300">Video</span>
                    </button>
                    <button onClick={() => fileRef.current?.click()} className="flex flex-col items-center gap-2 p-4 bg-slate-800 rounded-xl hover:bg-slate-700 transition-colors">
                      <Upload size={20} className="text-emerald-400" />
                      <span className="text-xs font-bold text-gray-300">Upload</span>
                    </button>
                  </div>

                  <input ref={photoRef} type="file" multiple accept="image/*" capture="environment" onChange={handleFileSelect} className="hidden" />
                  <input ref={videoRef} type="file" accept="video/*" capture="environment" onChange={handleFileSelect} className="hidden" />
                  <input ref={fileRef}  type="file" multiple onChange={handleFileSelect} className="hidden" />

                  {previews.length > 0 && (
                    <div className="grid grid-cols-3 gap-2 mb-4">
                      {previews.map((p, i) => (
                        <div key={i} className="relative aspect-square rounded-lg overflow-hidden border border-slate-700">
                          {files[i]?.type.startsWith('video/') ? (
                            <video src={p} className="w-full h-full object-cover" />
                          ) : (
                            <img src={p} alt="" className="w-full h-full object-cover" />
                          )}
                          <button onClick={() => removeFile(i)} className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full hover:bg-red-600">
                            <X size={12} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  <motion.button
                    whileTap={{ scale: 0.98 }}
                    onClick={upload}
                    disabled={files.length === 0 || uploading}
                    className="w-full py-3 bg-blue-600 text-white font-black rounded-xl uppercase disabled:bg-slate-800 disabled:text-gray-500 hover:bg-blue-500 transition-all flex items-center justify-center gap-2"
                  >
                    {uploading ? <><Loader2 size={15} className="animate-spin" /> Uploading…</> : <><Upload size={15} /> Upload {files.length} file{files.length !== 1 ? 's' : ''}</>}
                  </motion.button>
                </>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-3">
                    <Check size={18} className="text-emerald-400" />
                    <p className="text-sm font-bold text-emerald-400">Evidence attached to activity</p>
                  </div>
                  <motion.button whileTap={{ scale: 0.98 }} onClick={close}
                    className="w-full py-3 bg-slate-800 text-white font-black rounded-xl uppercase hover:bg-slate-700 transition-all">
                    Done
                  </motion.button>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
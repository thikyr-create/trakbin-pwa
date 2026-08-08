"use client";

import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, Video, Upload, X, Check, Loader2, Image as ImageIcon } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

interface EvidenceCaptureProps {
  open: boolean;
  onClose: () => void;
  buildingId?: string | null;
  routeId?: string | null;
  activityType: 'pickup' | 'skip' | 'report' | 'general';
  onUploaded?: (urls: string[]) => void;
}

export default function EvidenceCapture({ open, onClose, buildingId, routeId, activityType, onUploaded }: EvidenceCaptureProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadedUrls, setUploadedUrls] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files || []);
    setFiles((prev) => [...prev, ...selected]);

    selected.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => setPreviews((prev) => [...prev, reader.result as string]);
      reader.readAsDataURL(file);
    });

    if (fileInputRef.current) fileInputRef.current.value = '';
    if (videoInputRef.current) videoInputRef.current.value = '';
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
    setPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const upload = async () => {
    if (files.length === 0) return;
    setUploading(true);

    const urls: string[] = [];
    for (const file of files) {
      const ext = file.name.split('.').pop();
      const path = `evidence/${activityType}/${buildingId || 'general'}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const { error } = await supabase.storage.from('environmental-issues').upload(path, file, { upsert: false });
      if (!error) {
        const { data } = supabase.storage.from('environmental-issues').getPublicUrl(path);
        urls.push(data.publicUrl);
      }
    }

    setUploadedUrls(urls);
    setUploading(false);
    onUploaded?.(urls);
  };

  const close = () => {
    setFiles([]);
    setPreviews([]);
    setUploadedUrls([]);
    onClose();
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          onClick={close}
        >
          <motion.div
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            transition={{ type: 'spring', damping: 24, stiffness: 300 }}
            className="bg-slate-900 rounded-2xl w-full max-w-md shadow-2xl border border-slate-800 overflow-hidden max-h-[90vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-5 border-b border-slate-800 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/15 text-blue-400"><Camera size={16} /></span>
                <h3 className="text-lg font-black text-white uppercase">Attach Evidence</h3>
              </div>
              <button onClick={close} className="p-1 hover:bg-slate-800 rounded-full"><X size={20} className="text-gray-400" /></button>
            </div>

            <div className="p-5 overflow-y-auto flex-1">
              {uploadedUrls.length === 0 ? (
                <>
                  <div className="grid grid-cols-3 gap-2 mb-4">
                    <button onClick={() => fileInputRef.current?.click()} className="flex flex-col items-center gap-2 p-4 bg-slate-800 rounded-xl hover:bg-slate-700 transition-colors">
                      <Camera size={20} className="text-blue-400" />
                      <span className="text-xs font-bold text-gray-300">Photo</span>
                    </button>
                    <button onClick={() => videoInputRef.current?.click()} className="flex flex-col items-center gap-2 p-4 bg-slate-800 rounded-xl hover:bg-slate-700 transition-colors">
                      <Video size={20} className="text-purple-400" />
                      <span className="text-xs font-bold text-gray-300">Video</span>
                    </button>
                    <button onClick={() => fileInputRef.current?.click()} className="flex flex-col items-center gap-2 p-4 bg-slate-800 rounded-xl hover:bg-slate-700 transition-colors">
                      <Upload size={20} className="text-emerald-400" />
                      <span className="text-xs font-bold text-gray-300">Upload</span>
                    </button>
                  </div>

                  <input ref={fileInputRef} type="file" multiple accept="image/*" onChange={handleFileSelect} className="hidden" />
                  <input ref={videoInputRef} type="file" accept="video/*" onChange={handleFileSelect} className="hidden" />

                  {previews.length > 0 && (
                    <div className="grid grid-cols-3 gap-2 mb-4">
                      {previews.map((preview, i) => (
                        <div key={i} className="relative aspect-square rounded-lg overflow-hidden border border-slate-700">
                          <img src={preview} alt={`Preview ${i}`} className="w-full h-full object-cover" />
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
                    {uploading ? <><Loader2 size={15} className="animate-spin" /> Uploading...</> : <><Upload size={15} /> Upload {files.length} file{files.length !== 1 ? 's' : ''}</>}
                  </motion.button>
                </>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-3">
                    <Check size={18} className="text-emerald-400" />
                    <p className="text-sm font-bold text-emerald-400">{uploadedUrls.length} file{uploadedUrls.length !== 1 ? 's' : ''} uploaded</p>
                  </div>
                  <motion.button
                    whileTap={{ scale: 0.98 }}
                    onClick={close}
                    className="w-full py-3 bg-slate-800 text-white font-black rounded-xl uppercase hover:bg-slate-700 transition-all"
                  >
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
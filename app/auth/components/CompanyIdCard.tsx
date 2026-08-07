"use client";

import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import { Sora, Plus_Jakarta_Sans, JetBrains_Mono } from 'next/font/google';
import { Truck, X, CheckCircle2, Mail, Hash } from 'lucide-react';

const display = Sora({ subsets: ['latin'], display: 'swap', variable: '--font-display' });
const body = Plus_Jakarta_Sans({ subsets: ['latin'], display: 'swap', variable: '--font-body' });
const mono = JetBrains_Mono({ subsets: ['latin'], display: 'swap', variable: '--font-mono' });

interface Props { company: { id: number; name: string; email: string; license: string }; onClose: () => void; }

export default function CompanyIdCard({ company, onClose }: Props) {
  // FIX: Render outside the form scope using a portal
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  if (typeof window === 'undefined') return null;

  return createPortal(
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 z-[1200] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm" onClick={onClose}>
      <motion.div 
        initial={{ scale: 0.9, y: 20, rotate: -2 }} 
        animate={{ scale: 1, y: 0, rotate: 0 }} 
        transition={{ type: 'spring', stiffness: 240, damping: 18 }} 
        onClick={(e) => e.stopPropagation()} 
        className="w-full max-w-sm overflow-hidden rounded-[24px] bg-gradient-to-br from-emerald-700 to-emerald-900 text-white shadow-2xl"
      >
        <div className="relative p-6">
          <div aria-hidden className="pointer-events-none absolute inset-0 opacity-[0.16]" style={{ backgroundImage: 'repeating-radial-gradient(circle at 100% 0%, rgba(255,255,255,0.5) 0 1px, transparent 1px 24px)' }} />
          <button onClick={onClose} className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white/80 hover:bg-white/20 transition-colors"><X size={18} /></button>
          <div className="relative flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/15 ring-1 ring-white/20"><Truck className="h-6 w-6" /></div>
            <div>
              <p className={`${mono.className} text-[10px] font-bold uppercase tracking-[0.24em] text-emerald-200/80`}>Trakbin · Waste Company</p>
              <p className={`${display.className} text-lg font-black leading-tight`}>{company.name}</p>
            </div>
          </div>
          <div className="relative mt-6 space-y-2.5">
            <div className="flex items-center gap-2 text-sm font-semibold text-emerald-50"><Hash className="h-4 w-4 text-emerald-300" /> Company ID · <span className={mono.className}>#{company.id}</span></div>
            <div className="flex items-center gap-2 text-sm font-semibold text-emerald-50"><Mail className="h-4 w-4 text-emerald-300" /> {company.email}</div>
            <div className="flex items-center gap-2 text-sm font-semibold text-emerald-50"><CheckCircle2 className="h-4 w-4 text-emerald-300" /> License · {company.license}</div>
          </div>
          <div className="relative mt-6 rounded-xl bg-white/10 p-3 ring-1 ring-white/15">
            <p className="text-[11px] font-semibold leading-relaxed text-emerald-50/90">Save this card. You'll use your business email + password to sign in and manage collections, payouts and zones.</p>
          </div>
        </div>
      </motion.div>
    </motion.div>,
    document.body
  );
}
"use client";

import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Plus_Jakarta_Sans, JetBrains_Mono } from 'next/font/google';
import { ArrowLeft, Wrench, Radio } from 'lucide-react';
import DriverIssuesCard from '../components/DriverIssuesCard';

const body = Plus_Jakarta_Sans({ subsets: ['latin'], display: 'swap', variable: '--font-body' });
const mono = JetBrains_Mono({ subsets: ['latin'], display: 'swap', variable: '--font-mono' });
const EASE = [0.22, 1, 0.36, 1] as [number, number, number, number];

export default function HaulerIssuesPage() {
  const router = useRouter();

  return (
    <div className={`${body.className} relative min-h-screen bg-[#f6f7f6] text-gray-900`}>
      {/* ambient field */}
      <div aria-hidden className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute inset-0 opacity-[0.5]" style={{ backgroundImage: 'radial-gradient(circle, rgba(16,185,129,0.09) 1px, transparent 1px)', backgroundSize: '26px 26px' }} />
        <div className="absolute inset-x-0 top-0 h-72 bg-gradient-to-b from-emerald-50/70 via-emerald-50/20 to-transparent" />
      </div>

      <div className="relative z-10 mx-auto max-w-2xl px-4 py-8 sm:px-6">
        {/* header band */}
        <motion.header initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: EASE }} className="relative mb-6 overflow-hidden rounded-[24px] border border-emerald-200/70 bg-emerald-950 p-6 text-white shadow-xl shadow-emerald-950/20">
          <div aria-hidden className="pointer-events-none absolute inset-0 opacity-[0.16]" style={{ backgroundImage: 'repeating-radial-gradient(circle at 100% 0%, rgba(255,255,255,0.5) 0 1px, transparent 1px 26px)' }} />
          <div aria-hidden className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-emerald-500/20 blur-3xl" />
          <div className="relative z-10">
            <button onClick={() => router.push('/hauler-dashboard')} className="mb-4 flex items-center gap-2 text-sm font-bold text-emerald-100/80 transition-colors hover:text-white">
              <ArrowLeft size={18} /> Back to console
            </button>
            <div className="flex items-center gap-4">
              <div className="relative flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/15">
                <Wrench className="h-6 w-6 text-emerald-200" />
                <span className="absolute -right-0.5 -top-0.5 flex h-3 w-3">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex h-3 w-3 rounded-full bg-emerald-400 ring-2 ring-emerald-950" />
                </span>
              </div>
              <div>
                <p className={`${mono.className} flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.22em] text-emerald-200/70`}>
                  <Radio className="h-3.5 w-3.5" /> Field report
                </p>
                <h1 className="text-xl font-black leading-tight tracking-tight sm:text-2xl">Report an issue</h1>
              </div>
            </div>
            <p className="mt-3 max-w-md text-sm font-medium leading-relaxed text-emerald-100/70">
              Flag a breakdown, accident, blocked route or vehicle fault — it goes straight to your company with your location.
            </p>
          </div>
        </motion.header>

        {/* the report form + my reports */}
        <DriverIssuesCard />
      </div>
    </div>
  );
}
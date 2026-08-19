// app/page.tsx
"use client";

import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Sora, Plus_Jakarta_Sans } from 'next/font/google';

const display = Sora({ subsets: ['latin'], display: 'swap' });
const body = Plus_Jakarta_Sans({ subsets: ['latin'], display: 'swap' });
const EASE = [0.22, 1, 0.36, 1] as [number, number, number, number];

export default function Home() {
  const router = useRouter();

  return (
    <div className={`${body.className} relative min-h-screen overflow-hidden bg-emerald-950 text-white flex flex-col`}>
      {/* ── Living background: gradient depth ── */}
      <div aria-hidden className="absolute inset-0 bg-gradient-to-b from-emerald-950 via-emerald-900 to-emerald-800" />

      {/* dot grid */}
      <div
        aria-hidden
        className="absolute inset-0 opacity-[0.07]"
        style={{ backgroundImage: 'radial-gradient(circle, #ffffff 1px, transparent 1px)', backgroundSize: '28px 28px' }}
      />

      {/* soft glows */}
      <div aria-hidden className="absolute -top-32 -left-32 h-96 w-96 rounded-full bg-emerald-500/20 blur-3xl" />
      <div aria-hidden className="absolute -bottom-40 -right-32 h-[28rem] w-[28rem] rounded-full bg-emerald-400/10 blur-3xl" />

      {/* animated collection route */}
      <svg aria-hidden viewBox="0 0 1200 800" preserveAspectRatio="xMidYMid slice" className="absolute inset-0 h-full w-full opacity-[0.16]">
        <path id="hero-route" d="M-40,640 C 220,560 180,360 460,330 S 820,180 1240,120" fill="none" stroke="#6ee7b7" strokeWidth="2.5" strokeDasharray="8 10" />
        {[{ x: -40, y: 640 }, { x: 460, y: 330 }, { x: 1240, y: 120 }].map((p, i) => (
          <g key={i}>
            <circle cx={p.x} cy={p.y} r="6" fill="#34d399" />
            <circle cx={p.x} cy={p.y} r="6" fill="none" stroke="#34d399" opacity="0.5">
              <animate attributeName="r" from="6" to="26" dur="2.4s" begin={`${i * 0.7}s`} repeatCount="indefinite" />
              <animate attributeName="opacity" from="0.5" to="0" dur="2.4s" begin={`${i * 0.7}s`} repeatCount="indefinite" />
            </circle>
          </g>
        ))}
        <circle r="6" fill="#a7f3d0">
          <animateMotion dur="9s" repeatCount="indefinite">
            <mpath href="#hero-route" />
          </animateMotion>
        </circle>
      </svg>

      {/* grain */}
      <div
        aria-hidden
        className="absolute inset-0 opacity-[0.05] mix-blend-overlay"
        style={{
          backgroundImage:
            `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* ── Brand ── */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 text-center">
        <motion.h1
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: EASE }}
          className={`${display.className} text-7xl sm:text-9xl font-black tracking-tight text-white`}
        >
          TRAKBIN
        </motion.h1>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.25, ease: EASE }}
          className="mt-5 flex items-center gap-4"
        >
          <span className="h-px w-10 bg-emerald-300/50" />
          <p className="text-sm sm:text-base font-semibold tracking-[0.3em] text-emerald-100/80">
                        BUILDING CITIES NOT WASTE
          </p>
          <span className="h-px w-10 bg-emerald-300/50" />
        </motion.div>
      </main>

      {/* ── Actions ─ */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.5, ease: EASE }}
        className="relative z-10 flex flex-col sm:flex-row items-center justify-center gap-4 px-6 pb-14 pt-4"
        style={{ paddingBottom: 'calc(3.5rem + env(safe-area-inset-bottom))' }}
      >
        <motion.button
          whileHover={{ y: -2 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => router.push('/auth#login')}
          className="w-full sm:w-auto rounded-full border-2 border-white/40 px-12 py-4 text-base font-bold tracking-wide text-white transition-colors hover:border-white hover:bg-white/10"
        >
          Sign In
        </motion.button>
        <motion.button
          whileHover={{ y: -2 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => router.push('/auth#register')}
          className="w-full sm:w-auto rounded-full bg-emerald-500 px-12 py-4 text-base font-bold tracking-wide text-white shadow-xl shadow-emerald-950/50 transition-colors hover:bg-emerald-400"
        >
          Sign Up
        </motion.button>
      </motion.div>
    </div>
  );
}
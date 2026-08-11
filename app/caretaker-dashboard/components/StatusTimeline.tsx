"use client";

import { motion, type Variants } from 'framer-motion';
import { CircleCheck, Clock, Circle } from 'lucide-react';
import { useCaretakerSession } from '@/lib/store/useCaretakerSession';

const EASE = [0.22, 1, 0.36, 1] as [number, number, number, number];

const list: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.09, delayChildren: 0.05 } },
};
const row: Variants = {
  hidden: { opacity: 0, x: -10 },
  show: { opacity: 1, x: 0, transition: { duration: 0.4, ease: EASE } },
};

export default function StatusTimeline() {
  const { activeAssignment } = useCaretakerSession();
  const isActive = !!activeAssignment;

  const steps = [
    { label: 'Request submitted', status: 'completed' as const },
    { label: 'Under review', status: (isActive ? 'completed' : 'current') as 'completed' | 'current' | 'pending' },
    { label: 'Zone assigned', status: (isActive ? 'completed' : 'pending') as 'completed' | 'current' | 'pending' },
    { label: 'Schedule created', status: (isActive ? 'completed' : 'pending') as 'completed' | 'current' | 'pending' },
    { label: 'Service activated', status: (isActive ? 'completed' : 'pending') as 'completed' | 'current' | 'pending' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: EASE }}
      className="mb-8 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm"
    >
      <div className="mb-6 flex items-center justify-between">
        <h3 className="text-lg font-bold uppercase tracking-tight text-gray-900">Activation Journey</h3>
        <span className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400">
          {isActive ? 'Complete' : 'In progress'}
        </span>
      </div>

      <motion.ol variants={list} initial="hidden" animate="show" className="space-y-1">
        {steps.map((step, index) => {
          const isLast = index === steps.length - 1;
          return (
            <motion.li key={step.label} variants={row} className="relative flex items-start gap-4">
              {/* node + drawing connector */}
              <div className="relative flex flex-col items-center">
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ duration: 0.3, delay: 0.1 + index * 0.09, type: 'spring', stiffness: 260, damping: 18 }}
                  className="flex h-6 w-6 items-center justify-center"
                >
                  {step.status === 'completed' ? (
                    <CircleCheck className="h-6 w-6 text-green-600" />
                  ) : step.status === 'current' ? (
                    <motion.span animate={{ rotate: 360 }} transition={{ duration: 2.4, repeat: Infinity, ease: 'linear' }} className="flex">
                      <Clock className="h-6 w-6 text-amber-500" />
                    </motion.span>
                  ) : (
                    <Circle className="h-6 w-6 text-gray-300" />
                  )}
                </motion.span>
                {!isLast && (
                  <motion.span
                    initial={{ scaleY: 0 }}
                    animate={{ scaleY: 1 }}
                    transition={{ duration: 0.4, delay: 0.2 + index * 0.09, ease: EASE }}
                    className={`mt-1 h-7 w-0.5 origin-top ${step.status === 'completed' ? 'bg-green-200' : 'bg-gray-200'}`}
                  />
                )}
              </div>

              <div className="flex-1 pb-3 pt-0.5">
                <p className={`text-sm font-bold ${step.status === 'pending' ? 'text-gray-400' : 'text-gray-900'}`}>
                  {step.label}
                </p>
                {step.status === 'current' && (
                  <p className="mt-0.5 text-xs font-medium text-amber-600">Happening now…</p>
                )}
              </div>
            </motion.li>
          );
        })}
      </motion.ol>
    </motion.div>
  );
}
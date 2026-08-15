// app/waste-company-dashboard/components/entitlement/CapabilityLocked.tsx
"use client";

import { Lock, Sparkles } from 'lucide-react';

export default function CapabilityLocked({ title, capability }: { title: string; capability: string }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-300 bg-white py-20 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-100">
        <Lock size={24} className="text-gray-400" />
      </div>
      <h3 className="text-lg font-black text-gray-900">{title} is a higher-tier feature</h3>
      <p className="mt-2 max-w-md text-sm text-gray-500">
        Your current plan doesn't include {capability}. Upgrade to unlock it.
      </p>
      <a href="/waste-company-dashboard/settings"
        className="mt-5 inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-emerald-500">
        <Sparkles size={16} /> View plans
      </a>
    </div>
  );
}